/*
# Kova: Revoke PUBLIC execute on SECURITY DEFINER functions

PostgreSQL grants EXECUTE on functions to PUBLIC by default. The previous migration
revoked from anon/authenticated but not PUBLIC. This removes PUBLIC execute so only
the intended roles can call these functions.

- handle_new_user, handle_first_user_admin: only callable by trigger (postgres role)
- has_role, place_order: only callable by authenticated users
*/

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION handle_first_user_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION has_role(app_role, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION place_order(text, json) FROM PUBLIC;
