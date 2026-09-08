# Meridian Command

A clickable Oil & Gas project execution prototype. Built with Next.js, React, Base UI, Tailwind and Outfit. Requirements are preserved in `REQUIREMENTS.md`; role and acceptance-criteria mapping is in `REQUIREMENTS-CHECKLIST.md`.

## Run

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000 and select an internal role. The primary connected scenario is **Produced Water Treatment Optimization**. Other projects provide portfolio/detail examples.

## Present the change scenario

1. Enter as Project Manager and open CR-003 from the Command Center.
2. Review the supplied impact, or choose **Begin Specialist Review** to demonstrate the full assessment sequence.
3. Switch roles using the profile menu. Technical, Procurement, Operations and Commercial each complete their own assessment on CR-003.
4. Return as PM, select **Review Impact**, then approve, reject, request clarification or escalate.
5. Inspect Timeline, Actions, Management and Activity to see the connected changes.
6. Specialists update their stages, readiness, issues/actions and milestones. Completion guides specialist reports, PM-recorded external client review/sign-off, Commercial closure, then PM project closure.

## Verify

```sh
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm qa:audit
```

Tests expect a running application at localhost:3000. Set `QA_BASE_URL` to test another local port. The visual audit covers desktop, laptop, tablet and 390/320px phones, and writes screenshots and accessibility/overflow results under `qa-artifacts`.

## Prototype boundary

All records, assessments, costs, dates and external confirmations are mocked. Browser localStorage preserves mock state across role switches and reloads. No backend, authentication, real notifications, integrations, file storage, chemical calculations or automated technical decisions are included. Use a fresh browser profile to present the original seeded scenario.
