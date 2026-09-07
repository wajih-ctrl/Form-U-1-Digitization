# Application QA review

## Initial audit

Scope: role entry; command center; projects and all ten detail tabs; project setup; technical stages and detail sheets; readiness and dialogs; timeline; changes and all four decision dialogs; issues and sheets; actions; cost impact; documents and previews; activity; completion; management; administration; users and all dialogs; settings. Seven role previews, five project records, three change records.

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

Results and remaining prototype boundaries will be recorded after implementation and browser testing. This is a local sample-data prototype, not authenticated multi-user software.
