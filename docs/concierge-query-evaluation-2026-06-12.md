# Concierge Query Evaluation - 2026-06-12

## Scope

This was an API-only evaluation of the concierge chatbot through `POST /api/chat`.

No browser test was run. That means the tests verified the server response, action type, confirmation requirement, Pinecone retrieval metadata, and Calendly handoff payload, but did not click UI buttons or open the Calendly window.

## Test Artifacts

- Initial raw run: `test-results/concierge-query-eval-2026-06-12/results.json`
- Corrected run after fixes: `test-results/concierge-query-eval-2026-06-12-after-fixes/results.json`
- Corrected failures file: `test-results/concierge-query-eval-2026-06-12-after-fixes/failures.json`

## Final Result

Final API evaluation:

- Total query turns: 45
- Passed: 45
- Failed: 0

Dedicated guardrail suite:

- `npm run test:concierge:guardrails` passed.
- Pinecone retrieval was confirmed in diagnostics with retrieval mode `pinecone`.
- Booking actions now include an external HTTPS Calendly handoff URL.

## Real Issues Found

### 1. Booking did not respect the Calendly handoff expectation

Observed behavior:

- Booking queries returned `start_booking`, but the client executor opened the in-chat booking draft rather than the configured Calendly URL.
- This contradicted the product decision that Calendly handles appointment booking.

Fix:

- Added `calendlyUrl` to `ConciergeAction.payload`.
- Restored shared `getCalendlyUrl()`.
- Added Calendly URL payloads to deterministic booking actions and tool-proposed booking actions.
- Updated the client executor so confirmed `start_booking` actions open external Calendly URLs when configured.

### 2. Gentle-treatment request navigated instead of showing relevant treatments

Query:

```text
Show me gentle treatments for sensitive skin.
```

Observed behavior:

- The bot navigated to `/treatments` instead of showing the relevant gentle treatment options.

Fix:

- Added a pre-navigation branch for treatment-led concern requests.
- The bot now returns `show_treatments` with Light Therapy and HydraRevive.

### 3. Follow-up booking intent was missed

Conversation:

```text
I have pigmentation and sensitive skin.
Which option is gentler?
Add the SPF to my cart.
Actually book the consultation instead.
```

Observed behavior:

- The last turn returned treatment exploration instead of a booking action.
- The booking intent parser did not recognize "actually book..." phrasing.

Fix:

- Expanded booking intent detection to include "actually/instead" booking phrases.
- The last turn now returns a confirmation-required `start_booking` action with Calendly handoff.

### 4. Contextual product reference was too broad

Query:

```text
Add the SPF to my cart.
```

Observed behavior:

- After a two-product recommendation, the action could include both products instead of only Daily Shield SPF50.

Fix:

- Added generic product-reference narrowing for terms like SPF, sunscreen, serum, cream, cleanser, and balm.
- The SPF query now targets only Daily Shield SPF50.

### 5. Composer could imply a pending action had already completed

Observed behavior:

- A confirmation-required action could be rewritten as if it had already happened, such as "has been added to your cart."

Fix:

- Added a plan-preservation guard that rejects composed replies claiming completion for confirmation-required add, remove, booking, or navigation actions.
- The reply now stays in a pending/ready state until the user confirms.

### 6. Composer could output markdown links

Observed behavior:

- Some booking replies included markdown link formatting even though the widget should let the action carry the handoff.

Fix:

- Updated reply sanitization to strip markdown links to plain text.

## Final Behavioral Notes

The chatbot now does the important things correctly at the API level:

- Answers policy and service questions using Pinecone-backed retrieval.
- Recommends real Clear Skin products and treatments.
- Does not invent unavailable products.
- Requires confirmation for cart, checkout, and booking actions.
- Uses Calendly for booking handoff.
- Blocks unsafe cart or booking actions for pregnancy, breastfeeding, adverse reaction, infection, and isotretinoin scenarios.
- Handles contextual follow-ups for recommendations, SPF selection, booking pivots, and cancellation.

## Remaining Risks

- UI execution was not tested in this pass. A browser test should still verify that the confirmation button opens Calendly in a new window and that popup blocking does not interfere.
- The model composer is much better guarded now, but its natural-language wording can still vary. The deterministic action payload should be treated as the source of truth.
- The broad "build a routine" query can still be conservative if the user gives no skin concern. That is acceptable, but a future UX improvement would ask a tighter follow-up or open the quiz rather than saying too little.
