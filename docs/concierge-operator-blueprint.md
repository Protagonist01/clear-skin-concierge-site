# Clear Skin Concierge Operator Blueprint

## Goal

Evolve the concierge from a hybrid chat router into a goal-driven operator that is bounded by the website's real affordances, but excellent within those bounds.

For the demo:

- Keep the agent core real.
- Keep the harness central.
- Mock external providers where the product surface is missing.
- Do not fake agency in the chat layer.

## Current Baseline

The current concierge already has the right primitives, but they are spread across multiple layers:

- UI shell and browser-side action runner: [components/modules/Concierge.tsx](../components/modules/Concierge.tsx)
- Local routing and guided workflows: [lib/concierge-orchestrator.ts](../lib/concierge-orchestrator.ts)
- Action inference and normalization: [lib/site-actions.ts](../lib/site-actions.ts)
- Tool loop and model turn execution: [lib/agent/loop.ts](../lib/agent/loop.ts)
- Harness policy and validation: [lib/agent/harness.ts](../lib/agent/harness.ts)
- Tool schema definitions: [lib/agent/tools/definitions.ts](../lib/agent/tools/definitions.ts)
- Tool executors: [lib/agent/tools/registry.ts](../lib/agent/tools/registry.ts)
- Session state: [lib/session/store.ts](../lib/session/store.ts)

The main architectural problem is duplication:

- capabilities are defined in multiple places
- execution policy is split between the client, the router, and the tool layer
- verification is mostly implicit
- provider boundaries are not formalized

## North Star

The concierge should operate like this:

1. Understand the user's goal.
2. Observe a typed snapshot of the live site state.
3. Build a plan from known website affordances.
4. Execute one step at a time.
5. Verify the result after each step.
6. Recover if a step fails.
7. Resume interrupted work later.
8. Escalate only when the step is high risk.

## Core Principles

### 1. The harness is the nucleus

The harness should remain the system's control plane, not just a validator.

It should own:

- tool and affordance validation
- iteration limits
- token and cost envelopes
- trust policy enforcement
- audit logging
- verification logging
- recovery policy selection
- scenario and eval execution

### 2. One affordance registry

Every meaningful website capability should be declared once and reused everywhere:

- model tool definitions
- planner step options
- browser executor routing
- verification rules
- trust policy
- demo/live provider policy

### 3. Real runtime, mocked providers

For demo quality, keep these layers real:

- goal interpretation
- planning
- browser-side execution
- verification
- recovery
- tracing

Mock only what depends on missing or risky systems:

- booking availability and confirmations
- checkout completion
- CRM and customer profile lookups
- notifications
- long-term memory persistence

### 4. No success without verification

The agent must not claim success because a function returned.
It claims success only after the postcondition is confirmed in the runtime snapshot or the provider response.

### 5. The website is the operating environment

Do not build this as a DOM-scraping agent first.
Because we own the product, expose typed state and typed execution hooks from the app.

## Target Architecture

### Layer 1. Model adapter

Purpose:

- translate between the LLM and the internal plan/execution loop

Current baseline:

- [lib/agent/adapters/types.ts](../lib/agent/adapters/types.ts)
- [lib/agent/adapters/openrouter.ts](../lib/agent/adapters/openrouter.ts)

### Layer 2. Harness

Purpose:

- enforce policy around the turn
- validate plan steps
- cap cost and iteration depth
- produce the canonical trace

Current baseline:

- [lib/agent/harness.ts](../lib/agent/harness.ts)

Target direction:

- keep `AgentHarness`
- add plan, verification, recovery, and eval responsibilities around it

### Layer 3. Affordance registry

Purpose:

- define everything the site can do in one place

Each affordance should declare:

- `id`
- `scope`
- `risk`
- `parameters`
- `preconditions`
- `postconditions`
- `recovery policy`
- `demo mockable`
- `tags`

New files:

- [lib/agent/affordances/types.ts](../lib/agent/affordances/types.ts)
- [lib/agent/affordances/registry.ts](../lib/agent/affordances/registry.ts)

### Layer 4. Live site snapshot

Purpose:

- mirror what the user is actually seeing and doing

The snapshot should include:

- route and section
- visible product or treatment
- cart summary
- booking step and selections
- form validity and blockers
- recent UI events
- runtime busy state

New files:

- [lib/agent/runtime/site-snapshot.ts](../lib/agent/runtime/site-snapshot.ts)
- [lib/agent/runtime/contracts.ts](../lib/agent/runtime/contracts.ts)

### Layer 5. Planner

Purpose:

- turn user goals into multi-step executable plans

The planner should reason over affordances, not ad hoc chat heuristics.

New files:

- [lib/agent/planner/types.ts](../lib/agent/planner/types.ts)

Future implementation target:

- `goal.ts`
- `planner.ts`
- `repair.ts`

### Layer 6. Provider boundary

Purpose:

- separate demo integrations from live integrations

Provider families:

- booking
- cart
- checkout
- memory
- catalog
- profile
- notifications

New files:

- [lib/agent/providers/types.ts](../lib/agent/providers/types.ts)

Future implementation target:

- `providers/demo/*`
- `providers/live/*`

### Layer 7. Trace and evals

Purpose:

- make every turn, plan, step, verification, and recovery visible
- run the same hero tasks repeatedly as evals

New files:

- [lib/agent/trace/types.ts](../lib/agent/trace/types.ts)

Future implementation target:

- `evals/scenarios.ts`
- `evals/runner.ts`

## Trust Model

The trust model belongs to affordances, not to scattered UI conditionals.

- `silent`: safe and reversible, can run without user interruption
- `notify`: can run automatically, but should be surfaced in the activity stream
- `confirm`: must be approved before execution

Initial demo mapping:

- `silent`: navigation, page opens, search, view cart, recommendations
- `notify`: add to cart, remove from cart, routine curation, treatment selection
- `confirm`: start booking, checkout handoff, any future irreversible action

## Demo Boundary

### Keep real

- planning
- browser execution
- verification
- recovery
- traceability
- cart additions in the site
- booking flow progression in the site

### Mock

- real appointment availability
- real booking confirmation
- real checkout payment
- CRM enrichment
- email and SMS notifications
- production memory infrastructure

## Migration Plan

### Phase 1. Structural seam

- add the affordance registry
- add the site snapshot contracts
- add provider interfaces
- add planner and trace types
- keep the current concierge behavior intact

### Phase 2. Generate from the registry

- generate model tool definitions from affordances
- route existing action execution through registry metadata
- centralize risk policy

### Phase 3. Runtime verification

- make each browser action verify its postcondition
- add retries and structured recovery
- write traces per step

### Phase 4. Planner upgrade

- move from mostly direct routing to multi-step plans
- preserve local fast paths as a planner optimization, not as the architecture

### Phase 5. Provider split

- move booking, checkout, memory, and notifications behind interfaces
- add `demo` and `live` bundles

### Phase 6. Persistence and resumability

- replace in-memory-only session storage
- persist active tasks, partial plan state, and user preferences

### Phase 7. Evals

- define hero flows
- run them through the harness
- track completion, unnecessary confirmations, retries, and recovery quality

## Hero Demo Flows

1. Pigmentation consult to routine and cart
2. Acne treatment recommendation to booking flow in Lagos
3. Budget-constrained routine build to checkout handoff
4. Resume interrupted task from memory
5. Recover after unavailable booking slot or failed action

## First Implementation Slice

The first implementation slice should be small but foundational:

1. Introduce the affordance registry beside the current tool definitions.
2. Introduce the typed site snapshot contract beside the current client state.
3. Introduce provider interfaces for demo/live swapping.
4. Introduce plan and trace types for the harness to target later.

That gives us a stable architectural seam without breaking the existing concierge while we migrate behavior incrementally.
