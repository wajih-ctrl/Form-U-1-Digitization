# Form U-1 acceptance review

The prior home page was a project-execution role picker. The new home page implements the Form U-1 workspace using the exact supplied three-page scan.

## Current requirement verdict

The requested prototype features are implemented. This is not a claim of perfect OCR accuracy on every new document: evidence covers the supplied scan and a same-layout variant with 26 changed values. Physical phone-camera acceptance remains unverified. Authentication, admin roles, signatures and database handoff remain prototype functionality, as permitted by the requested scope; CSV and JSON downloads are functional.

The reference PDF was compared against `C:\Users\Rida\Downloads\Sample U_Form (1).pdf`; both SHA-256 hashes are `15263D2EC5430B057F839C2B6561F3F109BFE1727F8FB4DC71DC3502953ED302`.

### Latest audit fixes

- Vercel storage correction: uploaded pages and records now use a configured private Blob store, rather than the read-only deployment directory. Missing production storage is reported explicitly; there is no temporary-disk fallback. Local development retains disk storage.
- Production dependency traces include the OCR child script, Blob SDK, native modules and English language assets. Uploads are sent individually with a 4 MB cap. Live Vercel/Blob sign-off is pending a connected private store and redeployment; mocked remote tests are not live service verification.
- Storage-change validation passed: production build, all six browser scenarios on the production build (including actual reference OCR and camera capture), four storage tests, PDF/OCR deployment-asset checks, and a Vercel-mode missing-storage HTTP check. The last check returned the intended configuration message rather than attempting a deployment-directory write.

- Approved dashboard totals now open a matching list that includes records already marked Database Ready.
- Admin field mappings now show the actual geometry template even before processing, or while a Captured record is selected.
- Previous/next navigation respects the Needs review filter, preventing selection of invisible resolved fields.
- Section choices show remaining review counts; nozzle/table editors show OCR confidence; completed sections offer a next-item action.
- Reopening a captured form restores its record name. Nozzle guidance contrast was corrected.
- Latest verification: all three UI/audit regression tests passed, all three real-workflow/mobile/camera browser tests passed, TypeScript passed, and the nozzle accessibility scan reported zero violations. OCR logic was unchanged in this audit; the workflow test processed the real reference again.

### Requested data coverage

All requested groups are represented in the 296 mapped fields: general identification and addresses; shell courses/dimensions/materials/joints/heat treatment; flanges/bolting/washers; head geometry/materials/joints; pressure/design/impact/test information; tubesheets/tubes; the editable 5-row, 12-column nozzle area; supports; remarks/notes; shop and field-assembly certification. Source cells shared on the printed form retain combined readings as well as separate bolting and test subfields where the text can be split. Ambiguous splits stay unresolved for engineer review.

Dashboard, intake, page preparation, processing, side-by-side review, structured record, history, approval, vessel records/search/filters, database/export and admin are available as workspace views. Camera and upload are intake options within the same screen. Approval blocks every unresolved value on both the client and server.

| Requirement | Implementation / evidence |
| --- | --- |
| Exact reference, no fixed sample values | `public/reference-u1.pdf`; geometry-only template; real Tesseract OCR |
| Different values in the same layout | 26 changed-value OCR assertions passed (manufacturer/address, purchaser/address, identifiers, year, materials, dimensions, pressure, nozzles, certification) |
| Primary camera flow | Take Photos, environment camera request, native capture fallback; automated simulated-camera test passed |
| Page preparation | Preview, rectangular edge estimation, manual crop, rotate, retake, use photo, add next page, remove, reorder; three-page gate |
| PDF / image upload | Actual PDF rasterization including JBIG2, PNG/JPG/WebP image processing |
| Processing screen | Live server progress; failed identification gives actionable retry/page-order guidance |
| Side-by-side review | Original pages, zoom, page controls, approximate source highlights, editable structured fields |
| Technical fields | 296 mapped fields in 14 sections; separate outer and inner-chamber data; explicit bolting and test subfields |
| Nozzles | Five reference-layout rows, twelve editable columns; selection highlights source and edits are audited |
| Field review | Confirm, correct, flag, N/A, previous/next, section/filter controls; conservative confidence for disagreeing OCR candidates |
| Correction history | Immutable original extraction plus previous/revised value, status, reviewer and timestamp |
| Approval | Both UI and server reject unresolved records; approved values are locked; reopening revokes approval |
| Database ready / export | Real CSV/JSON downloads, structured table/JSON preview, explicitly simulated database handoff |
| Dashboard / records | Actual local counts, recent forms/activity, searchable records, status/year filters, structured record detail |
| Admin | Prototype users/roles, record/status summaries, extraction information, mappings and activity |
| Responsive design | Desktop/tablet review, mobile capture, 390px overflow checks passed |
| Persistence | Source page images and records stored in `.u1-data`; local reviewer preference |
| Build / tests | Production build passed; all three Form U-1 browser tests passed |

## September 9 UI and requirement recheck

- Jost is loaded with Next's font system and applied throughout the interface, including controls and technical values.
- All Form U-1 workspace screens use the updated industrial design: dashboard, intake, processing, review, structured records, history, approval, export and administration.
- Added focus review, next unresolved field navigation, searchable expandable technical sections, persistent capture drafts and accessible modal keyboard behavior.
- Fixed navigation from unprocessed records, mobile table overflow, tablet navigation overlay, text contrast and semantic heading/definition-list issues.
- Real OCR regression passed all 26 changed-value assertions again. The production browser suite covers the original workflow plus the new UI interactions. The optimized production build passes.
- All five browser scenarios passed across the production verification runs: two design tests and the OCR-to-export flow, followed by the two mobile/camera tests after restarting the server. Rebuilding during the first run invalidated its running server assets and caused those last two tests to time out; their clean rerun passed.
- Automated accessibility scans found no violations on dashboard, capture, review, structured record, history, approval, export and all administration tabs after fixes. Responsive checks include 320, 390, 760 and 1024px widths; this does not replace physical device testing.

### Remaining prototype limits

OCR is not guaranteed to be error-free. Uncertain, blank and redacted values require engineer review. The reference contains redacted identification and certification fields, which cannot be recovered. All unresolved fields block approval.

Camera tests use a simulated browser camera; physical phone optics and permissions have not been verified on the user's device. Capture straight-on, keep the paper flat, use contrasting surroundings and correct the crop when needed. The crop is rectangular, not a perspective reconstruction.

Historical layouts, handwriting, authentication, legal electronic signatures and external database connectivity remain outside this prototype. Manufacturer/address splitting is automatic only where a visible delimiter makes the boundary clear; ambiguous text stays review-required.

Test artifacts are generated under `tmp/u1-tests/`. QA sign-off records are removed after the browser suite; the supplied sample is retained as an unapproved reference extraction for presentation.

Final production smoke check: the real PDF upload/OCR endpoint produced record U1-66BD2CB3 with 296 fields and Review Required status. A premature approval request returned HTTP 400. Dashboard and review accessibility scans reported zero violations after contrast, heading and keyboard-scroll fixes. Tablet and mobile review screens had no horizontal document overflow.

