/*
# Kova: Switch has_role to SECURITY INVOKER, revoke place_order from authenticated

## Changes

### has_role
- Switched from SECURITY DEFINER to SECURITY INVOKER.
- The function queries user_roles, which has an RLS policy allowing users to read
  only their own rows (auth.uid() = user_id). Under INVOKER, if a caller passes a
  different _user_id, RLS filters the result to zero rows and the function returns
  false. No privilege escalation is possible.
- This removes the SECURITY DEFINER warning from the database linter.

### place_order
- Revoked EXECUTE from authenticated and PUBLIC. The function remains SECURITY
  DEFINER but is now only callable by the postgres/service_role (used by the
  place-order edge function that runs with the service role key).
- The frontend checkout now calls the edge function instead of calling place_order
  directly via supabase.rpc().
*/

CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE EXECUTE ON FUNCTION place_order(text, json) FROM authenticated;
REVOKE EXECUTE ON FUNCTION place_order(text, json) FROM PUBLIC;
