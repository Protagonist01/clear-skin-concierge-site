# Concierge QA Report

Date: 2026-05-22

## Scope

This report covers representative concierge scenario families rather than every possible wording permutation.

Verification sources:

- `npm run test:concierge`
- `npm run build`
- `npm run test:concierge:browser`
- Direct `POST /api/chat` verification for the reported bug prompt
- `npm run test:concierge:live`

## Exact Bug Recheck

Prompt tested against the live `/api/chat` route:

`can you add them to my cart and give me the routine instructions`

Context supplied:

- prior routine recommendation for pigmentation
- last referenced product set to `brightening-complex`

Observed result:

- returned a deterministic `curate_routine` tool call
- added `Brightening Complex` and `Daily Shield SPF50` to cart
- replied with routine guidance:
  `I built a routine for pigmentation and added it to your cart. Use Brightening Complex, then finish with Daily Shield SPF50 each morning.`

Status: `PASS`

## Scenario Matrix

| Scenario family | Representative prompts | Status | Evidence |
|---|---|---|---|
| Direct navigation | `Take me to my cart.` | PASS | Local routing tests passed |
| Informational advisory | `How does booking work at Clear Skin?` | PASS | Planner stays answer-first with no deterministic steps |
| Skincare workflow start | `I have pigmentation and want a starter routine.` | PASS | Guided workflow tests passed |
| Treatment matching workflow start | concern-led treatment prompts | PASS | Guided workflow tests passed |
| Clarification prompts | ambiguous selection prompts | PASS | Clarification tests passed |
| Booking flow initiation | `Book this in Lagos for me.` | PASS | Deterministic booking plan tests passed |
| Booking flow continuation | booking handoff after booking UI opens | PASS | Browser-state verifier test passed |
| Checkout from filled cart | `Please help me checkout now.` | PASS | Deterministic checkout tests passed |
| Checkout from empty cart | `Checkout for me.` with empty cart | PASS | Correctly blocked in eval suite |
| Resume saved work | `Continue where I left off.` | PASS | Resume plan and reply tests passed |
| Multi-workflow resume | continue with booking + skincare saved | PASS | Queue-aware resume tests passed |
| Single-product follow-up | `Add that to my cart.` after product context | PASS | Contextual follow-up tests passed |
| Treatment follow-up | `Book it for me.` after treatment context | PASS | Contextual treatment follow-up tests passed |
| Compound add + checkout | `Add Daily Shield SPF50 to my cart and take me to checkout.` | PASS | Deterministic compound plan tests passed |
| Compound open + add | `Open Brightening Complex and add it to my cart.` | PASS | Deterministic compound plan tests passed |
| Compound open + add + checkout | `Open Brightening Complex, add it to my cart, and take me to checkout.` | PASS | Deterministic compound plan tests passed |
| Compound routine + checkout | `Build me a starter routine for pigmentation and take me to checkout.` | PASS | Deterministic compound plan tests passed |
| Compound open + book | `Open HydraRevive and book it in Lagos for me.` | PASS | Deterministic compound plan tests passed |
| Contextual compound follow-up | `Can you add them to my cart and give me the routine instructions?` | PASS | New regression test plus live `/api/chat` verification passed |
| Browser widget: routine follow-up | routine ask -> `can you add them to my cart and give me the routine instructions` -> `Take me to my cart.` | PASS | `npm run test:concierge:browser` passed |
| Browser widget: booking confirmation handoff | `Book this in Lagos for me.` from HydraRevive page | PASS | `npm run test:concierge:browser` passed |

## Working Now

- The fast path no longer steals contextual compound routine follow-ups away from the deterministic planner.
- Prior skincare context can now be recovered from saved conversation history when the follow-up does not repeat the concern.
- Routine follow-ups now return practical usage guidance instead of only acknowledging a cart mutation.
- The concierge widget now defers multi-intent prompts to the agent planner instead of collapsing them into a single local site action.
- Explicit destinations like `Take me to my cart` now win over remembered product context in the browser widget.
- Existing direct action, booking, checkout, resume, and compound-request coverage still passes after the fix.

## Breaking Now

No failing scenarios were found in the covered deterministic and local-routing matrix on 2026-05-22.

Browser-driven regressions were found during this pass and fixed:

1. The widget fast path intercepted `add them to my cart and give me the routine instructions` as a single-product local cart action.
2. Remembered product context could incorrectly override an explicit cart destination like `Take me to my cart.`

## Still Unverified

- Live model advisory behavior through OpenRouter was not exercised because `OPENROUTER_API_KEY` was not set when `npm run test:concierge:live` ran.
- Natural-language coverage is representative, not exhaustive. Untested paraphrases may still reveal edge cases.

## Recommended Next QA Additions

1. Add browser-driven concierge tests for the widget itself, not only the API route.
2. Add live-model evals once `OPENROUTER_API_KEY` is available.
3. Add more pronoun-heavy follow-ups such as `add those too`, `how do I use them at night`, and `take that routine to checkout`.
