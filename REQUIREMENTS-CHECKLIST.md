# Prototype requirements verification

Source of truth: [REQUIREMENTS.md](REQUIREMENTS.md), supplied by the user. This is a clickable Oil & Gas project-execution prototype with mocked data, not production software.

## Role ownership

| Role | Owns / can change | Must not do |
|---|---|---|
| Project Manager | Project setup, project coordination and issue triage/escalation, PM-owned actions, recording external client confirmations, approve/reject/clarify/escalate changes, formal project closure | Write specialist assessments or complete another team's specialist work |
| Technical / Lab | Technical-owned stages/readiness/issues/actions, technical assessment, technical records, performance verification and technical completion report | Approve project changes; edit another specialist's assessment |
| Operations | Operations-owned readiness/stages/milestones/issues/actions and operational assessment | Approve project changes; edit technical/commercial/procurement assessments |
| Procurement / Logistics | Supply, material, supplier and logistics readiness/issues/actions; procurement assessment | Approve project changes; complete Operations or Technical work |
| Commercial | Awarded commercial scope/commitment, commercial assessment and mocked cost impact, commercial actions and commercial closure | Change general project ownership/schedule; approve project changes |
| Management | Read-only portfolio and project drill-down, major changes, client/PM dependencies and escalations | Change operational records, assessments, configuration or PM decisions |
| Admin | Mock users and role assignments, projects, phases, category lists, status display labels and stage definitions | Record PM decisions or specialist findings |

Client and Supplier have no internal role selection and no dashboard. Client confirmation is recorded by the PM as an external dependency. UI permission rules also guard the prototype's state update methods. This is intentionally not authentication or server security.

## Acceptance criteria traceability

| # | Requirement | Implementation / verification |
|---|---|---|
| 1 | End-to-end execution visibility | Command Center → technical/readiness → changes → timeline/actions → completion |
| 2 | PM central coordinator/decision owner | PM-only decision controls and state guards; Admin cannot approve |
| 3 | Separate internal roles | Role-specific navigation, route boundary, record/team ownership controls |
| 4 | External Client/Supplier | External assignments, supplier dependencies and PM-recorded client confirmations; no external portals |
| 5 | Four operational problems | Promised vs forecast dates, traceable specialist review/history, team/person/coordinator fields, combined schedule/cost impact |
| 6 | Contract award through validation | Twelve milestones, project setup/create, manual specialist progress, ordered completion checklist |
| 7 | Sample → analysis → proposal → approval → execution | Eight technical stages with linked records, dependencies and role-owned updates |
| 8 | Complete scope-change scenario | Begin Specialist Review → four specialist assessments → PM decision → records update |
| 9 | Specialist impact ownership | Each role can edit only its own assessment; Operations enters mocked days, Commercial enters mocked cost |
| 10 | PM combined-impact decision | Review Impact plus approve/reject/clarify/escalate dialogs; decision notes and history |
| 11 | Dashboard priorities | Health, phase/progress, promised/forecast, exposure, clickable attention, readiness, milestones, dependencies, actions and activity |
| 12 | Execution readiness areas | All nine specified readiness items and all five statuses |
| 13 | Ownership and traceability | Team/person/coordinator, dates, linked actions/documents, specialist and decision history |
| 14 | Completion and validation | Ten-step checklist, role-owned confirmations, dependencies, mocked supporting records, client sign-off and project closure |
| 15 | Management visibility | Read-only overview and project drill-down; major changes, exposure, client/PM dependencies and escalated issues |
| 16 | Manual operational workflow | Specialist findings and confirmations are entered manually; no assumed ERP/workflow integration |
| 17 | No real backend or integrations | No API/backend/database/authentication, notification delivery, external messaging, file uploads/storage, AI, accounting or chemical calculations; analytics removed |
| 18 | Oil & Gas terminology | Produced water treatment scenario, laboratory work, chemicals, supplier delays, facility access and field execution |
| 19 | Appropriate operations aesthetic | Outfit typography, navy navigation, teal actions, status hierarchy, structured tables, timelines and decision panels |
| 20 | Clickable major surfaces | Automated role, workflow, record-dialog, filter, navigation, configuration and responsive browser checks |

## Screen and field coverage

- All nineteen minimum screens are present. Project Detail has all ten specified tabs.
- Project Setup includes all requested fields; only PM/Admin manage general fields, while Commercial edits awarded commercial scope/commitment.
- Projects include type, client/site, PM, phase/progress, promised/forecast dates, health, separate open-item counts and cost/timeline exposure.
- Change register exposes specialist impact summaries. Change Detail includes Review Impact, all four decision actions, specialist owners, required actions, documents and decision/assessment history.
- Actions include responsible team, assigned person, coordinator, priority, due date, waiting-on, impact if late and next step, including the My Decisions filter.
- Cost/Timeline includes original and forecast dates, days, mock cost, reason, responsible team, milestone, review and PM status.
- Documents use all eleven requested mocked record types; no actual files are uploaded or stored.
- Admin configuration edits mocked phase/category lists, status labels and stage names; actual role ownership rules stay fixed to this document.

## Deliberately excluded

No Client/Supplier portal, chat, CRM, ERP, construction claims, accounting system, real procurement integration, laboratory calculations, chemical recommendations, email/WhatsApp integration, real authentication, live notifications or file storage. The former notification preferences view now explains role responsibilities. Local browser persistence retains only the prototype's mock records and UI state.

## Automated verification

`pnpm build`, `pnpm typecheck`, `pnpm test:e2e`, and `pnpm qa:audit` are the repeatable checks. Browser results are in `qa-artifacts/tests.json` and `qa-artifacts/audit.json`. Tests include the seven-role matrix, the four-specialist change scenario, and the complete specialist → client → commercial → project closeout journey.

Final results: 22/22 browser tests passed; 130 route/viewport checks completed with no detected overflow or runtime errors; automated page and tested-dialog accessibility scans passed. Production build and TypeScript checks passed.

