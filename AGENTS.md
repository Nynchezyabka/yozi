<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Creature growth and mutation rules live in src/lib/pet.ts as pure functions with tests in pet.test.ts; the page only renders them. Why: keeps rules testable.
- Save data stays in browser localStorage until accounts are requested. Why: no backend yet.
- Creature visuals are a slot-based layer stack (src/lib/layers.ts); each mutation targets one slot so new art plugs in without redrawing others. Sleep phases live in src/lib/sleep.ts, diary lines in src/lib/chronicle.ts. Why: composable, testable rules.
- Secret legendary form and achievements live in src/lib/legend.ts (pure, tested); best streak is never reset. Why: hard goal without punishing the user.
- Health profile, pauses and doctor sheet live in src/lib/health.ts (pure, tested). Why: medical-ish rules must stay testable.
- AI helper is bring-your-own-key, called directly from the browser (src/lib/ai.ts, same scheme as Focus Cash Keeper); the app builds as a static SPA (spa mode + postbuild index.html) for Layero. Why: no server, user-chosen model.
