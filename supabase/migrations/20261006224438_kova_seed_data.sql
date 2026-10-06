/*
# Kova: Seed data — categories, products, and reviews

Populates the database with realistic Arabic and English bookstore data so the
platform looks and feels like a live store on first launch.

## Categories (8)
- Books: Fiction, Philosophy, History, Self-Development
- Stories: Children's Tales, Fantasy, Mystery, Romance

## Products (20)
- 12 books across 4 book categories
- 8 stories across 4 story categories
- Each has realistic title, author, description, price, rating, stock, cover color

## Reviews (16)
- Approved reviews spread across popular products with reader names and comments
*/

-- ============================================================
-- CATEGORIES
-- ============================================================

INSERT INTO categories (name, slug, kind) VALUES
  ('Fiction',         'fiction',         'book'),
  ('Philosophy',      'philosophy',      'book'),
  ('History',         'history',         'book'),
  ('Self-Development','self-development','book'),
  ('Children''s Tales','childrens-tales', 'story'),
  ('Fantasy',         'fantasy',          'story'),
  ('Mystery',         'mystery',          'story'),
  ('Romance',         'romance',          'story')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PRODUCTS
-- ============================================================

INSERT INTO products (title, author, slug, description, price, stock, pages, cover_hue, kind, category_id, is_featured, rating, reviews_count, sales_count, published_at) VALUES
  -- BOOKS: Fiction
  ('The City of Memory', 'Layla Al-Rashed', 'the-city-of-memory',
   'A haunting novel about a woman who returns to her childhood city only to find that the streets have rearranged themselves around her memories. A meditation on home, loss, and the architecture of belonging.',
   14.99, 45, 320, 210, 'book',
   (SELECT id FROM categories WHERE slug='fiction'), true, 4.6, 12, 340, '2025-09-15'),

  ('Whispers of the Olive Grove', 'Hassan Mirza', 'whispers-of-the-olive-grove',
   'Three generations of a family tend the same olive grove in southern Lebanon, weathering war, exile, and reconciliation. A lyrical saga rooted in the land.',
   12.99, 60, 288, 85, 'book',
   (SELECT id FROM categories WHERE slug='fiction'), false, 4.3, 8, 210, '2025-06-01'),

  ('The Cartographer''s Daughter', 'Yusuf El-Haddad', 'the-cartographers-daughter',
   'A young woman inherits her father''s unfinished map of a country that no longer exists on any atlas. Her journey to complete it becomes a journey through history itself.',
   16.99, 30, 410, 160, 'book',
   (SELECT id FROM categories WHERE slug='fiction'), true, 4.8, 15, 520, '2025-03-20'),

  -- BOOKS: Philosophy
  ('On the Patience of Stones', 'Nadia Farouk', 'on-the-patience-of-stones',
   'A philosophical exploration of stillness, endurance, and the quiet wisdom of things that outlast us. Drawing from Sufi poetry and Stoic thought, Farouk builds a bridge between ancient traditions.',
   18.99, 25, 240, 280, 'book',
   (SELECT id FROM categories WHERE slug='philosophy'), true, 4.7, 9, 180, '2025-08-10'),

  ('The Question Between Us', 'Omar Suleiman', 'the-question-between-us',
   'What does it mean to live a good life in an age of acceleration? Suleiman interrogates modern ethics through the lens of classical Islamic philosophy and contemporary moral dilemmas.',
   15.99, 40, 196, 190, 'book',
   (SELECT id FROM categories WHERE slug='philosophy'), false, 4.2, 6, 95, '2025-01-25'),

  ('Fragments of the Unseen', 'Salma Ibrahim', 'fragments-of-the-unseen',
   'A collection of philosophical essays on the invisible forces that shape our lives — time, grief, hope, and the spaces between words. Luminous and deeply personal.',
   13.99, 35, 180, 300, 'book',
   (SELECT id FROM categories WHERE slug='philosophy'), false, 4.4, 5, 70, '2024-11-12'),

  -- BOOKS: History
  ('The Silk Road Reimagined', 'Tariq Al-Bishri', 'the-silk-road-reimagined',
   'A sweeping history of the trade routes that connected East and West, told through the stories of merchants, monks, and musicians who traveled them. Richly illustrated.',
   22.99, 20, 480, 25, 'book',
   (SELECT id FROM categories WHERE slug='history'), true, 4.9, 18, 410, '2025-07-05'),

  ('Cairo: A Biography', 'Aisha Mahmoud', 'cairo-a-biography',
   'From its founding as a Fatimid fortress to its modern life as a megacity, Cairo tells its own story through the voices of those who built, destroyed, and rebuilt it.',
   19.99, 50, 360, 15, 'book',
   (SELECT id FROM categories WHERE slug='history'), false, 4.5, 10, 260, '2025-04-18'),

  ('The Libraries That Burned', 'Khalid Ansari', 'the-libraries-that-burned',
   'A account of the great libraries of the ancient and medieval world — Alexandria, Baghdad, Timbuktu — and what their loss teaches us about the fragility of knowledge.',
   17.99, 28, 296, 340, 'book',
   (SELECT id FROM categories WHERE slug='history'), false, 4.3, 7, 130, '2025-02-14'),

  -- BOOKS: Self-Development
  ('The Morning Habit', 'Reem Al-Zahabi', 'the-morning-habit',
   'A practical, science-backed guide to designing a morning routine that actually sticks. No fluff, no guilt — just small changes that compound into transformation.',
   11.99, 80, 160, 120, 'book',
   (SELECT id FROM categories WHERE slug='self-development'), true, 4.1, 22, 890, '2025-10-01'),

  ('Deep Work for Curious Minds', 'Adam Khoury', 'deep-work-for-curious-minds',
   'Reclaim your attention in a world designed to steal it. Khoury offers a framework for sustained focus tailored to creatives, researchers, and lifelong learners.',
   14.99, 65, 224, 200, 'book',
   (SELECT id FROM categories WHERE slug='self-development'), false, 4.5, 11, 350, '2025-05-22'),

  ('Letters to My Younger Self', 'Fatima Noor', 'letters-to-my-younger-self',
   'Thirty short letters addressing the questions we all wish we could go back and answer. Warm, honest, and quietly revolutionary.',
   10.99, 55, 140, 350, 'book',
   (SELECT id FROM categories WHERE slug='self-development'), false, 4.6, 9, 200, '2024-12-20'),

  -- STORIES: Children's Tales
  ('The Star That Fell Upward', 'Mariam Saif', 'the-star-that-fell-upward',
   'When a little star falls the wrong way — up instead of down — it discovers a whole universe of friends who were also lost. A bedtime story about belonging.',
   6.99, 100, 48, 45, 'story',
   (SELECT id FROM categories WHERE slug='childrens-tales'), true, 4.8, 14, 600, '2025-09-01'),

  ('The Fox and the River', 'Jamaluddin Rahimi', 'the-fox-and-the-river',
   'A clever fox meets a wise old river who teaches it the value of patience. A gentle, beautifully illustrated tale for young readers.',
   5.99, 120, 36, 140, 'story',
   (SELECT id FROM categories WHERE slug='childrens-tales'), false, 4.5, 8, 420, '2025-06-15'),

  -- STORIES: Fantasy
  ('The Last Djinn of Aleppo', 'Zaynab Hakim', 'the-last-djinn-of-aleppo',
   'In a city where the djinn have all but vanished, a young scholar summons the last one — and discovers that wishes are more dangerous than secrets.',
   9.99, 70, 180, 260, 'story',
   (SELECT id FROM categories WHERE slug='fantasy'), true, 4.7, 16, 580, '2025-08-20'),

  ('The Lantern Keeper', 'Bahram Oveis', 'the-lantern-keeper',
   'A girl inherits a lantern that lights the path between worlds. To keep the balance, she must walk it every night — until the night the path disappears.',
   8.99, 85, 156, 310, 'story',
   (SELECT id FROM categories WHERE slug='fantasy'), false, 4.4, 10, 320, '2025-04-30'),

  -- STORIES: Mystery
  ('The Case of the Missing Minaret', 'Daud Karimi', 'the-case-of-the-missing-minaret',
   'A detective with an eidetic memory arrives in a quiet town only to find its most famous landmark has vanished overnight. No rubble, no witnesses — just empty sky.',
   7.99, 90, 132, 0, 'story',
   (SELECT id FROM categories WHERE slug='mystery'), false, 4.2, 7, 180, '2025-07-12'),

  ('Smoke Over the Bazaar', 'Layla Al-Rashed', 'smoke-over-the-bazaar',
   'A perfume seller in the old bazaar smells something that shouldn''t exist — and what follows pulls her into a mystery older than the market itself.',
   7.99, 75, 120, 20, 'story',
   (SELECT id FROM categories WHERE slug='mystery'), false, 4.0, 5, 140, '2025-03-08'),

  -- STORIES: Romance
  ('Pomegranate Season', 'Noor Al-Sabah', 'pomegranate-season',
   'Every autumn she returns to her grandmother''s orchard. Every autumn he is there too — though they have never spoken. This year, the pomegranates ripen early.',
   6.99, 95, 96, 0, 'story',
   (SELECT id FROM categories WHERE slug='romance'), true, 4.6, 12, 450, '2025-09-28'),

  ('The Bookshop on Rue de Damas', 'Hala Tahir', 'the-bookshop-on-rue-de-damas',
   'Two strangers keep borrowing the same obscure poetry collection from a tiny bookshop. The shopkeeper leaves notes in the margins for both of them to find.',
   6.99, 88, 104, 340, 'story',
   (SELECT id FROM categories WHERE slug='romance'), false, 4.7, 13, 380, '2025-05-10')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- REVIEWS
-- ============================================================

INSERT INTO reviews (product_id, reviewer_name, rating, comment, approved, created_at) VALUES
  ((SELECT id FROM products WHERE slug='the-city-of-memory'), 'Amina', 5,
   'I read this in one sitting. The way the author describes the city shifting around you — it felt like walking through a dream I''d forgotten I had.', true, '2025-09-20'),
  ((SELECT id FROM products WHERE slug='the-city-of-memory'), 'Khaled', 4,
   'Beautiful prose, though the middle section lingered. Still, the ending stayed with me for days.', true, '2025-09-25'),
  ((SELECT id FROM products WHERE slug='the-cartographers-daughter'), 'Sara', 5,
   'One of the most original novels I have read this year. The map metaphor never feels forced — it grows naturally out of the story.', true, '2025-04-02'),
  ((SELECT id FROM products WHERE slug='the-cartographers-daughter'), 'Yusuf', 5,
   'I bought this on a whim and could not put it down. The historical detail is extraordinary.', true, '2025-04-15'),
  ((SELECT id FROM products WHERE slug='on-the-patience-of-stones'), 'Omar', 5,
   'A book that asks you to slow down and think alongside it. Not a fast read, but a deep one. I keep returning to certain chapters.', true, '2025-08-18'),
  ((SELECT id FROM products WHERE slug='the-silk-road-reimagined'), 'Layla', 5,
   'History as it should be written — through people, not dates. The chapter on the musicians of Samarkand alone is worth the price.', true, '2025-07-15'),
  ((SELECT id FROM products WHERE slug='the-silk-road-reimagined'), 'Hassan', 4,
   'Dense but rewarding. I wish there were more maps, but the storytelling is superb.', true, '2025-07-20'),
  ((SELECT id FROM products WHERE slug='the-silk-road-reimagined'), 'Nadia', 5,
   'A masterpiece of narrative history. I have gifted this to three friends already.', true, '2025-08-01'),
  ((SELECT id FROM products WHERE slug='cairo-a-biography'), 'Tariq', 4,
   'As a Cairene, I was skeptical — but Mahmoud captures the city''s soul. Some sections feel rushed, but the best parts are unforgettable.', true, '2025-05-02'),
  ((SELECT id FROM products WHERE slug='the-morning-habit'), 'Reem', 4,
   'Finally a habit book that doesn''t shame you. The 5-minute-start idea changed my mornings within a week.', true, '2025-10-03'),
  ((SELECT id FROM products WHERE slug='the-morning-habit'), 'Adam', 3,
   'Solid advice but some of it felt recycled from other books. Still, the tone is warm and practical.', true, '2025-10-04'),
  ((SELECT id FROM products WHERE slug='deep-work-for-curious-minds'), 'Salma', 5,
   'This helped me finish my thesis. The attention audit exercise alone was a revelation.', true, '2025-06-01'),
  ((SELECT id FROM products WHERE slug='the-star-that-fell-upward'), 'Mariam', 5,
   'My daughter asks for this every single night. The illustrations are gorgeous and the message is beautiful.', true, '2025-09-05'),
  ((SELECT id FROM products WHERE slug='the-star-that-fell-upward'), 'Khalid', 5,
   'We read it together and both cried a little. In the best way.', true, '2025-09-10'),
  ((SELECT id FROM products WHERE slug='the-last-djinn-of-aleppo'), 'Aisha', 5,
   'Atmospheric, suspenseful, and the ending floored me. I did not expect to care this much about a djinn.', true, '2025-08-25'),
  ((SELECT id FROM products WHERE slug='pomegranate-season'), 'Noor', 5,
   'Tender and vivid. I could smell the orchard. A perfect short read for autumn.', true, '2025-09-30'),
  ((SELECT id FROM products WHERE slug='the-bookshop-on-rue-de-damas'), 'Hala', 4,
   'The margin-notes idea is so clever and romantic. I wish it were longer!', true, '2025-05-15')
ON CONFLICT DO NOTHING;
