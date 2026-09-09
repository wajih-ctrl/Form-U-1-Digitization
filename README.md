# Vessel — Form U-1 Engineering Records

A local Next.js prototype for the exact three-page U1-15 layout in `public/reference-u1.pdf`, copied from the supplied **Sample U_Form (1).pdf**. The home page is the Form U-1 workspace. Existing project-execution routes are retained separately.

## Run

Requires Node.js 22+ (Node 24 tested) and pnpm.

```sh
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Choose **New Form → Take Photos** or **Upload PDF / Images**. **Try the supplied reference form** uploads the actual reference PDF through the same pipeline.

For a production build:

```sh
pnpm build
pnpm start
```

This app requires a persistent Node server with a writable working directory; it is not a static export or an ephemeral serverless deployment. Keep `node_modules`, `scripts/u1-process.mjs`, and `lib/u1` available alongside the build. The PDF.js WASM codecs and English OCR language data are installed dependencies. No API key or cloud OCR service is required.

PDF upload explicitly registers the installed PDF.js worker, and the upload route's deployment trace includes the worker and WASM codecs. If an older deployment reports `Setting up fake worker failed` with a missing `pdf.worker.mjs`, rebuild and redeploy this version. After building and starting the production server, run `pnpm test:upload-deployment` to verify the deployment manifest and actual three-page PDF rendering. Set `QA_BASE_URL` to test another server.

The tracing configuration resolves the physical PDF.js package directory before including its assets. With pnpm, tracing both `node_modules/pdfjs-dist` (a directory symlink) and file entries below it can make Vercel reject an otherwise successful build with `patch_build_4xx` / "invalid deployment package". The deployment test checks for this conflict. This fix requires a new deployment of the updated configuration.

This worker fix does not turn local record storage into serverless persistence. A `/var/task` deployment still needs a persistent storage implementation or a persistent Node host; storing records only in temporary function storage would lose them between instances.

## Workflow

1. Capture/upload all three pages: vessel/design, nozzles/supports, certification.
2. Preview pages, detect/correct crop boundaries, rotate, retake, remove or reorder.
3. Process Form. Progress messages reflect actual OCR work, not a timer simulation.
4. Compare extracted fields with the original. Select a field or table cell to highlight its approximate source. Confirm, edit, flag or explicitly mark N/A. Inspect each section before using its high-confidence confirmation shortcut.
5. Inspect the structured record and correction history. Each action records the previous value, original extraction, reviewer and timestamp.
6. Complete every review item and approve. Server-side checks prevent approval of missing/unresolved fields and lock approved values.
7. Download actual CSV/JSON exports or demonstrate a simulated database handoff. Reopening revokes approval and retains the audit history.

## What is real

- PDF rasterization (including the reference's JBIG2 scan encoding), image upload, camera acquisition, rectangular boundary estimation, editable crop and rotation.
- Tesseract OCR reads submitted pixels, with page identification and individual field/cell recognition. `lib/u1/template.mjs` stores labels and normalized page locations only. It contains no reference values.
- Separate shell-side and inner-chamber sections, nozzle multi-row table, head/flange/tube tables, pressure/test data and certification fields.
- Original page images, extracted data, reviews and approvals persist locally under `.u1-data/` (gitignored).
- Review actions, search/status/year filters, approval validation, export downloads and audit history.

## Prototype boundaries

- Authentication, roles, legal signatures and external database connectivity are simulated. Reviewer identity is a prototype input, not an authenticated identity.
- Supports printed values in the supplied layout. It does not support handwriting or alternate historical form layouts.
- OCR is fallible. Confidence is an estimate; disagreements between page and cell readings are flagged. Redacted and missing values require explicit human disposition. No values are inferred from the reference.
- Manufacturer and address share a printed line. A visible delimiter followed by an address number enables automatic separation; otherwise the engineer resolves the ambiguity.
- Source locations are approximate. Camera boundary estimation works best against a contrasting background with a flat, straight-on page. Manual crop controls remain available. Physical phone-camera testing is still recommended; automated tests use a simulated camera.
- Native live camera access needs HTTPS or localhost and permission. On a phone using a non-secure network URL, the native file/camera picker provides a fallback.
- Reference cells constrain the supported layout: 2 outer shell course rows and the 5-row nozzle area, including unused cells requiring N/A review. Significant reflow requires a new template.

## Verification

With the app running:

```sh
pnpm typecheck
pnpm test:e2e
node scripts/u1-extraction-test.mjs
```

The OCR regression creates a test-only printed variant of the supplied layout with 26 changed values across identification, manufacturer/address, materials, dimensions, pressure, nozzles and certification. It checks actual OCR output against those changed values. Fixtures/results live under `tmp/u1-tests/` and are gitignored.

The interface uses Jost throughout, a dark engineering sidebar, restrained sage accents, responsive technical tables and consistent controls across the workspace. Review includes a focused view and navigation to the next unresolved item. Structured records have searchable, expandable sections. Capture drafts survive refresh, and dialogs support Escape, focus trapping and focus return. The design browser tests cover these interactions and responsive widths down to 320px.

The browser suite exercises actual PDF upload/OCR, side-by-side review, table correction, audit history, server approval blocking, approval/export/reopening, mobile overflow and simulated camera capture/retake/crop/rotation. Its simulated approval record is removed after testing. Older test suites refer to the previous project-execution prototype and are not Form U-1 acceptance tests.
