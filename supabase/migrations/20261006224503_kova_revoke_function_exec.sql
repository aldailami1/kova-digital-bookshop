/*
# Kova: Revoke public execute on trigger functions

The SECURITY DEFINER trigger functions handle_new_user and handle_first_user_admin
should only be invoked by database triggers on auth.users, never via the REST API.
has_role is needed by authenticated users (the admin page calls it via RPC).

## Changes
- REVOKE EXECUTE on handle_new_user and handle_first_user_admin from anon and authenticated
- GRANT EXECUTE on has_role and place_order to authenticated only (revoke from anon)
*/

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION handle_first_user_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION has_role(app_role, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION has_role(app_role, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION place_order(text, json) FROM anon;
GRANT EXECUTE ON FUNCTION place_order(text, json) TO authenticated;
