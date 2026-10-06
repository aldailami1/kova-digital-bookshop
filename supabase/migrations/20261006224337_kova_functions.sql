/*
# Kova: Database functions and triggers

## Functions
- has_role(_role app_role, _user_id uuid) — SECURITY DEFINER, checks if a user has a given role
- place_order(_customer_name text, _items json) — SECURITY DEFINER, atomically creates an order
  with line items, decrements product stock, increments sales_count, returns the new order id
- handle_new_user() — trigger function: auto-creates a profile row when a new auth.users row is inserted
- handle_first_user_admin() — trigger function: makes the first ever signup an admin

## Triggers
- on_auth_user_created — fires handle_new_user() + handle_first_user_admin() AFTER INSERT on auth.users
*/

-- ============================================================
-- has_role function
-- ============================================================

CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============================================================
-- place_order function
-- ============================================================

CREATE OR REPLACE FUNCTION place_order(_customer_name text, _items json)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item json;
  v_product products%ROWTYPE;
  v_qty integer;
  v_line_total numeric(10,2);
  v_grand_total numeric(10,2) := 0;
BEGIN
  if _items is null or jsonb_array_length(_items::jsonb) = 0 then
    raise exception 'Cannot place an empty order';
  end if;

  INSERT INTO orders (user_id, customer_name, status, currency)
  VALUES (auth.uid(), _customer_name, 'paid', 'USD')
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items::jsonb)
  LOOP
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'Invalid quantity in order item';
    end if;

    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::uuid;
    if not found then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;

    if v_product.stock < v_qty then
      raise exception 'Insufficient stock for: %', v_product.title;
    end if;

    v_line_total := v_product.price * v_qty;
    v_grand_total := v_grand_total + v_line_total;

    INSERT INTO order_items (order_id, product_id, title, price, quantity)
    VALUES (v_order_id, v_product.id, v_product.title, v_product.price, v_qty);

    UPDATE products
      SET stock = stock - v_qty,
          sales_count = sales_count + v_qty
    WHERE id = v_product.id;
  END LOOP;

  UPDATE orders SET total = v_grand_total WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

-- ============================================================
-- handle_new_user trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

-- ============================================================
-- handle_first_user_admin trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION handle_first_user_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') THEN
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- TRIGGERS on auth.users
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_first_admin ON auth.users;
CREATE TRIGGER on_auth_user_first_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_first_user_admin();
