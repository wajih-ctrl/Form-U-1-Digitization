# Application QA review

## Initial audit

Scope: role entry; command center; projects and all ten detail tabs; project setup; technical stages and detail sheets; readiness and dialogs; timeline; changes and all four decision dialogs; issues and sheets; actions; cost impact; documents and previews; activity; completion; management; administration; users and all dialogs; settings. Seven role previews, five project records, two change records.

### Findings before changes

- Critical: all operational state resets on refresh. Project setup, preferences, profile editing, technical record creation and issue escalation can claim success without changing records.
- High: global search is a toast-only placeholder; project selector always displays the primary project; secondary projects have no operational records and must not masquerade as the primary project.
- High: approval can repeat side effects; date shifting uses local time before UTC serialization; clarification assigns every request to procurement; status edits are absent from activity history.
- High: role previews expose PM decisions to specialist roles; management summaries mislabel rejected/escalated changes; resolved issues remain in attention counts; cost summaries contain unexplained constants.
- High: technical and field completion are hardcoded even while stages remain open; activity timestamps render the month as the time.
- High: narrow screens squeeze long technical rows, large metrics and project summaries; dialogs lack height limits; sheet footers can be compressed; tabs wrap inside a fixed height.
- Medium: undersized controls, inconsistent card borders, weak primary-button contrast, inaccessible unlabeled search/select controls, missing selected filter semantics, no skip link, and missing empty document/change searches.
- Medium: admin Statuses links to itself; deactivation promises reactivation without offering it; document preview implies a nonexistent full document.
- Build: TypeScript errors explicitly suppressed in Next configuration; no automated QA coverage.

## Verification

The supplied requirements are preserved in REQUIREMENTS.md and mapped in REQUIREMENTS-CHECKLIST.md. The requirements review identified further gaps in specialist ownership, Management/Admin restrictions, the four-team assessment handoff, editable admin configuration, required list/detail fields, and the completion/sign-off journey. These were implemented before the final regression pass.

### Changes

- Standardized Outfit typography, navy/teal hierarchy, controls, cards, status colors, focus states and spacing across the application.
- Responsive tables become labeled records on phones; dialogs and sheets scroll within the viewport, with reachable controls and consistent close/cancel behavior.
- Replaced placeholder actions with saved mock state: project setup, search, records, user edits/reactivation, issue escalation, assessments, decisions and closeout.
- Enforced the seven-role matrix in navigation, controls and state mutations. PM owns project decisions; specialists own their work; Management is read-only; Admin owns mock configuration.
- Added the explicit four-specialist review sequence, manual cost/day assessments, combined PM review, linked downstream actions and decision history.
- Implemented dependency-aware completion through specialist reporting, external client review/sign-off, Commercial closure and PM project closure.
- Completed requested project/action/issue/cost/change fields, eleven document types, management indicators and admin phase/category/status/stage configuration.
- Removed notification preferences and analytics to respect the no-live-systems requirement.
- Added accessible empty/error/recovery states, truthful mock-record previews and persistence feedback.

### Verified scope

- Final regression: 22 browser tests passed, with zero failures, skips or flaky results (191 seconds).
- Production build and TypeScript checks pass.
- 26 routes at 1440, 1024, 768, 390 and 320 pixels: 130 checks, no detected body/main overflow or uncaught page errors.
- Automated WCAG A/AA page checks at desktop: no detected violations. Representative readiness, issue, document and all four change-decision dialogs also receive accessibility checks.
- Browser tests cover role entry/permissions, project tabs/setup/validation, all change decision paths, specialist review, ownership, records, admin configuration/users, search/filter/sorting, mobile navigation, dialog close behavior and full project closeout.
- Screenshots were visually inspected for layout, typography, density, responsive stacking, controls and dialog sizing.

### Prototype boundaries

This is mocked software as requested. Permissions demonstrate role behavior, not authenticated server security. The primary project contains the connected end-to-end scenario; other portfolio projects intentionally show their own summaries and empty operational tabs. Browser storage retains mock records only. There is no live backend, external portal, messaging, notification delivery, file storage, accounting, AI, chemical calculation or automated engineering judgment.

Automated checks do not certify every possible input or assistive-technology combination. Reproducible evidence is in qa-artifacts/audit.json and qa-artifacts/tests.json; README.md contains run and demo instructions.


