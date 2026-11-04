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

- The FR-KING app UI lives in src/app (ported from the original project, rendered client-only from src/routes/index.tsx); keep it behaviour-identical to the original.
- All backend endpoints live in src/routes/api/public/$.ts and use Lovable Cloud tables (licenses, signals, app_config) via the admin client; tables have RLS with no public policies so only the server can read them.
- A standalone HTML/CSS/JS + PHP edition mirrors the same endpoints; keep both in sync when endpoint behaviour changes.
- Pair-chart sample candles are isolated in a display-only component; never feed preview prices into signal generation or add market fetching for cosmetic changes.
