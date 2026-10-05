<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Kova store reads catalog data from the browser client with useQuery; checkout goes through the `place_order` DB function so prices/stock are computed server-side.
- Admin access is a `user_roles` row checked via `has_role`; the first signed-up user becomes admin automatically.
- Cart, currency and theme live in `src/lib/store.tsx` (localStorage); prices are stored in USD and converted on display.
