create type public.app_role as enum ('admin','user');
create type public.product_kind as enum ('book','story');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  kind public.product_kind not null,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  author text not null,
  description text not null default '',
  price numeric(10,2) not null default 0,
  kind public.product_kind not null,
  category_id uuid references public.categories(id) on delete set null,
  cover_hue int not null default 30,
  rating numeric(2,1) not null default 0,
  reviews_count int not null default 0,
  sales_count int not null default 0,
  stock int not null default 100,
  pages int not null default 200,
  is_featured boolean not null default false,
  published_at date not null default current_date,
  created_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

create table public.profiles (
  id uuid primary key,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid,
  reviewer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null default 'paid',
  total numeric(10,2) not null default 0,
  currency text not null default 'USD',
  customer_name text,
  created_at timestamptz not null default now()
);
grant select, update on public.orders to authenticated;
grant all on public.orders to service_role;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  price numeric(10,2) not null,
  quantity int not null default 1
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "cat read" on public.categories for select using (true);
create policy "cat admin" on public.categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "prod read" on public.products for select using (true);
create policy "prod admin" on public.products for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "profile own read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "profile own insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profile own update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "roles own read" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "reviews public read" on public.reviews for select using (approved = true);
create policy "reviews own read" on public.reviews for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "reviews insert own" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "reviews admin update" on public.reviews for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "reviews admin delete" on public.reviews for delete to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "orders own read" on public.orders for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "orders admin update" on public.orders for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "items read" on public.order_items for select to authenticated using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.has_role(auth.uid(),'admin'))));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.refresh_product_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p set
    rating = coalesce((select round(avg(rating)::numeric,1) from public.reviews where product_id = pid and approved), 0),
    reviews_count = (select count(*) from public.reviews where product_id = pid and approved)
  where p.id = pid;
  return null;
end; $$;
create trigger reviews_refresh after insert or update or delete on public.reviews for each row execute function public.refresh_product_rating();

create or replace function public.place_order(_items jsonb, _customer_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare oid uuid; it jsonb; p record; q int; tot numeric := 0;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'empty cart'; end if;
  insert into public.orders (user_id, customer_name) values (auth.uid(), _customer_name) returning id into oid;
  for it in select * from jsonb_array_elements(_items) loop
    q := greatest(1, least(20, (it->>'quantity')::int));
    select * into p from public.products where id = (it->>'product_id')::uuid;
    if p.id is null then raise exception 'product not found'; end if;
    if p.stock < q then raise exception 'نفد المخزون: %', p.title; end if;
    insert into public.order_items (order_id, product_id, title, price, quantity) values (oid, p.id, p.title, p.price, q);
    update public.products set stock = stock - q, sales_count = sales_count + q where id = p.id;
    tot := tot + p.price * q;
  end loop;
  update public.orders set total = tot where id = oid;
  return oid;
end; $$;
grant execute on function public.place_order(jsonb, text) to authenticated;

insert into public.categories (slug, name, kind) values
('novels','روايات','book'),('history','تاريخ','book'),('philosophy','فلسفة وفكر','book'),('self-dev','تطوير الذات','book'),
('kids','قصص أطفال','story'),('short','قصص قصيرة','story'),('folk','حكايات شعبية','story'),('adventure','مغامرات','story');

insert into public.products (slug,title,author,description,price,kind,category_id,cover_hue,sales_count,stock,pages,is_featured,published_at) values
('mawsim','موسم الهجرة إلى الشمال','الطيب صالح','رواية خالدة تتتبع مصطفى سعيد في رحلته بين قرية سودانية على ضفاف النيل وشوارع لندن الباردة، في مواجهة عميقة بين الشرق والغرب والهوية والذاكرة.',14.99,'book',(select id from categories where slug='novels'),25,1840,120,172,true,'2024-03-10'),
('thulathiya','ثلاثية غرناطة','رضوى عاشور','ملحمة روائية عن آخر أيام الأندلس، تروي حكاية عائلة غرناطية عبر أجيال من الصمود والفقد بعد سقوط المدينة.',19.50,'book',(select id from categories where slug='novels'),340,1520,80,504,true,'2024-06-01'),
('azazeel','عزازيل','يوسف زيدان','راهب مصري في القرن الخامس الميلادي يدوّن سيرته على رقوق قديمة، في رواية تأملية عن الإيمان والشك والعنف باسم العقيدة.',16.00,'book',(select id from categories where slug='novels'),200,1310,60,380,false,'2023-11-20'),
('saq-albambu','ساق البامبو','سعود السنعوسي','عيسى، ابن لأب كويتي وأم فلبينية، يبحث عن مكانه بين وطنين لا يعترف به أي منهما بالكامل.',13.75,'book',(select id from categories where slug='novels'),140,1105,45,396,false,'2025-01-15'),
('muqaddima','المقدمة','ابن خلدون','العمل التأسيسي لعلم الاجتماع والتاريخ، يحلل فيه ابن خلدون نشوء الدول وسقوطها ومفهوم العصبية والعمران البشري.',22.00,'book',(select id from categories where slug='history'),45,960,70,720,true,'2022-09-05'),
('andalus-tarikh','الأندلس: التاريخ المصوّر','طارق السويدان','رحلة بصرية وسردية عبر ثمانية قرون من الحضارة الإسلامية في شبه الجزيرة الإيبيرية.',27.00,'book',(select id from categories where slug='history'),15,540,30,410,false,'2025-08-12'),
('tahafut','تهافت التهافت','ابن رشد','رد فلسفي عميق على الغزالي، يدافع فيه ابن رشد عن العقل والبرهان في واحدة من أشهر المناظرات الفكرية.',18.25,'book',(select id from categories where slug='philosophy'),260,420,55,460,false,'2023-04-18'),
('hayy','حي بن يقظان','ابن طفيل','قصة فلسفية عن طفل ينشأ وحيداً على جزيرة ويصل بالتأمل والعقل إلى معرفة الكون وخالقه.',9.99,'book',(select id from categories where slug='philosophy'),165,780,90,160,true,'2025-09-01'),
('fann-alla','فن اللامبالاة بالعربية','مارك مانسون','دليل صريح ومنعش لعيش حياة أفضل عبر اختيار ما يستحق اهتمامك فعلاً.',11.50,'book',(select id from categories where slug='self-dev'),55,2100,150,240,false,'2025-07-22'),
('adat','العادات الذرية','جيمس كلير','طريقة عملية مثبتة لبناء عادات جيدة والتخلص من السيئة عبر تغييرات صغيرة تتراكم بنتائج مذهلة.',15.00,'book',(select id from categories where slug='self-dev'),95,2450,8,320,true,'2025-09-20'),
('arnab','الأرنب الذي أراد أن يطير','كامل كيلاني','حكاية مصوّرة للأطفال عن أرنب صغير يحلم بالسماء ويتعلم أن لكل كائن جناحاً من نوع خاص.',5.99,'story',(select id from categories where slug='kids'),110,1650,200,32,true,'2025-08-30'),
('najma','النجمة التي سقطت في البئر','تغريد النجار','قصة دافئة عن فتاة تنقذ نجمة صغيرة سقطت في بئر القرية، وعن الصداقة والشجاعة.',6.50,'story',(select id from categories where slug='kids'),280,1220,180,40,false,'2025-09-10'),
('dunya','دنيا زاد','محمد المخزنجي','مجموعة قصص قصيرة مكثفة تلتقط لحظات إنسانية هشة في المدينة الحديثة.',8.75,'story',(select id from categories where slug='short'),320,610,75,140,false,'2024-12-02'),
('ardh-burtuqal','أرض البرتقال الحزين','غسان كنفاني','قصص قصيرة مؤثرة عن الاقتلاع والحنين والأرض التي لا تغيب عن الذاكرة.',7.25,'story',(select id from categories where slug='short'),35,880,95,120,true,'2024-05-15'),
('alf-layla','حكايات ألف ليلة وليلة','مجهول','مختارات من أشهر حكايات شهرزاد: السندباد، وعلاء الدين، وعلي بابا، في طبعة منقحة مصوّرة.',12.00,'story',(select id from categories where slug='folk'),300,1390,110,280,true,'2025-02-14'),
('juha','نوادر جحا','تراث شعبي','أطرف حكايات جحا ونوادره الذكية الساخرة التي تناقلتها الأجيال عبر العالم العربي.',4.99,'story',(select id from categories where slug='folk'),70,990,140,96,false,'2025-09-25'),
('jazeera','جزيرة الكنز المنسية','نبيل فاروق','مغامرة مشوقة لثلاثة أصدقاء يكتشفون خريطة قديمة تقودهم إلى جزيرة غامضة في البحر الأحمر.',8.99,'story',(select id from categories where slug='adventure'),185,720,5,180,false,'2025-09-28'),
('sahra','رحلة إلى قلب الصحراء','أحمد خالد توفيق','قافلة تائهة، وواحة لا تظهر على الخرائط، وسرّ يمتد لآلاف السنين في مغامرة لا تُنسى.',9.50,'story',(select id from categories where slug='adventure'),40,860,65,210,true,'2025-10-01');

insert into public.reviews (product_id, reviewer_name, rating, comment, created_at)
select p.id, r.name, r.rating, r.comment, now() - (r.days || ' days')::interval
from public.products p
cross join lateral (values
  ('سارة المهيري', 5, 'من أجمل ما قرأت هذا العام، لغة آسرة وأحداث لا تُنسى.', 3),
  ('خالد العتيبي', 4, 'عمل رائع يستحق القراءة، وإن كانت بعض الفصول طويلة قليلاً.', 12),
  ('ليلى حداد', 5, 'اشتريتها هدية وانتهى بي الأمر بقراءتها بنفسي! أنصح بها بشدة.', 27)
) as r(name, rating, comment, days);

insert into public.reviews (product_id, reviewer_name, rating, comment, created_at)
select id, 'يوسف بن علي', 3, 'جيدة لكنها لم تكن بمستوى توقعاتي.', now() - interval '40 days' from public.products where slug in ('azazeel','fann-alla','dunya','juha');