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

## Rules

- `src/lib/pitch.ts` owns the profiling-consent compliance guard and the model/hypothesis state; `src/data/pitchPool.ts` owns the extended demo pool. Keep every state transition routed through `enforceProfiling` so no code path can surface a personalized offer to a customer without profiling consent.
- Demo data flows one way: `src/data/mockData.ts` (user-supplied shapes) -> `pitchPool.ts` -> `nba-store.tsx` -> tabs. Do not put pool profiles or KPI targets into `mockData.ts`.

- Exploration calculations, NLP demo-score normalization and decision keys/summaries live in `src/lib/pitch.ts`; the shared store owns exploration and resolved decisions so tabs remain consistent.
- Preserve the supplied `mockData.ts`; localized pool overrides and channel assignments belong in `pitchPool.ts`. Delivery controls simulate gateway handoff until a real integration is configured; never claim actual delivery.
