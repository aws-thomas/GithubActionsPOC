# Plan: GitHub Actions CI/CD Proof-of-Concept with Flask Calculator

## Objective

Produce a working repository that demonstrates a GitHub Actions pipeline
(push / PR triggers, install, lint, test, build, artifact upload, optional
GitHub Pages deploy) using a minimal Python Flask calculator app. The
calculator is split into two phases so that Phase 2 can be added later
as a real code change that drives the documented CI/CD flow end-to-end.

## Deliverables

1. `Plan.md` — this file.
2. `systemrequirements.md` — every application the reader must install
   locally to follow the documentation.
3. `GithubActionsCI.md` — the main documentation, covering all 11
   numbered sections from the request, plus three teaching-focused
   additions (Prerequisites, Concepts primer, Troubleshooting
   appendix), with screenshot placeholder comments throughout.
4. Flask calculator app (Phase 1 only — UI, no arithmetic):
   - `app.py` — Flask entrypoint serving the calculator template.
   - `templates/index.html` — calculator UI with buttons and a display.
   - `static/style.css` — minimal styling.
   - `tests/test_app.py` — unit tests for the UI route.
   - `requirements.txt` — Flask, pytest, flake8, Frozen-Flask.
   - `.flake8` — lint configuration.
   - `Makefile` (or equivalent npm-style scripts via a `scripts.ps1`
     and `scripts.sh`) — `lint`, `test`, `build` targets.
5. `.github/workflows/ci.yml` — the CI pipeline.
6. `.gitignore` — Python + build output ignores.
7. `README.md` — short pointer to `GithubActionsCI.md` and
   `systemrequirements.md`.
8. `checklist-template.csv` — importable into Google Sheets as a
   tracking template (see Google Sheet section below).
9. `phase2-todo.md` — describes the Phase 2 arithmetic work left
   intentionally unimplemented, so a future code push demonstrates the
   pipeline.

## Architecture decisions

- **Lint**: `flake8` — standard, lightweight, well-known on docs.
- **Test**: `pytest` — minimal config, easy to demonstrate.
- **Build**: `Frozen-Flask` freezes the Flask app to static HTML. This
  gives a real "build artifact" (a `build/` directory) that can be both
  uploaded as a workflow artifact AND deployed to GitHub Pages. For
  Phase 1 (UI only) this works cleanly. Phase 2 (backend arithmetic)
  will need either client-side JS or a non-Pages host; that limitation
  is called out in the docs so it can be addressed when Phase 2 lands.
- **Branch structure**: `main` (protected, deploy source) and `develop`
  (integration). Feature branches merge into `develop` via PR; release
  PRs from `develop` to `main`. This is what the docs will describe in
  section 1.
- **Workflow triggers**: `push` to any branch and `pull_request`
  targeting `main` or `develop`. Deploy job runs only on `push` to
  `main`.
- **No emojis** in any document or code file — explicit constraint.

## Documentation structure (`GithubActionsCI.md`)

Each of the 11 sections will have:

- A short "Why this matters" paragraph.
- Numbered actions the reader performs.
- Code/config snippets in fenced blocks.
- Screenshot placeholders written as visible HTML comments:
  `<!-- SCREENSHOT: <what to capture> -->` followed by a one-line
  caption suggestion. The placeholders are intentionally visible so the
  reader knows exactly where to drop an image.

The doc opens with two teaching sections before the numbered steps:

**Prerequisites** (before Section 1) — what the reader must already
have or know before starting:

- A GitHub account (free tier is sufficient).
- Git installed locally and a one-time `git config` for name/email.
- Basic comfort with a terminal (running commands, `cd`, viewing
  files). Links to a short Git primer for readers who need it.
- The applications listed in `systemrequirements.md` installed.
- A new empty GitHub repository created (the doc shows how).

**Concepts primer** (before Section 4) — the vocabulary the reader
needs before reading the workflow YAML, kept to one screen:

- *Workflow* — a YAML file under `.github/workflows/` that defines
  automation.
- *Event* — what triggers the workflow (`push`, `pull_request`, etc.).
- *Job* — a unit of work that runs on one runner. Jobs run in parallel
  by default; `needs:` makes them sequential.
- *Step* — a single command or action inside a job.
- *Runner* — the virtual machine GitHub provisions to run the job
  (`ubuntu-latest`, etc.).
- *Action* — a reusable step published by GitHub or the community
  (`actions/checkout`, `actions/setup-python`).
- *Artifact* — a file or directory uploaded from a job that can be
  downloaded from the Actions UI or by a later job.

Section list (mirrors the request exactly):

1. Prepare Repository — configure branch structure.
2. Configure Scripts — add lint / test / build scripts.
3. Validate Local Execution — run lint / tests / build locally.
4. Create Workflow Structure — `.github/workflows`, CI YAML.
5. Configure CI Pipeline — checkout, runtime setup, deps.
6. Configure Validation Steps — lint, test, build steps.
7. Configure Artifact Handling — upload, validate download.
8. Trigger Workflow — push, open PR.
9. Validate Results — review logs, fix failures, confirm green run.
10. Configure Deployment — GitHub Pages (or alternative), deploy steps.
    Includes explicit coverage of:
    - `Settings > Pages > Source` set to "GitHub Actions" (the new
      Pages flow — the old "deploy from branch" flow is called out so
      readers don't follow stale tutorials).
    - Required workflow permissions block:
      `permissions: { pages: write, id-token: write, contents: read }`.
    - The `actions/configure-pages`, `actions/upload-pages-artifact`,
      and `actions/deploy-pages` action chain.
11. Validate Deployment — verify URL, confirm deploy.

Appendices:

- **A. Workflow structure** — diagram explaining job/step relationships
  in the YAML.
- **B. Troubleshooting** — the failure modes a first-time reader will
  most likely hit, each with the symptom, the cause, and the fix:
  - YAML indentation errors (the "did not find expected key" message).
  - `actions/checkout` missing → later steps can't find files.
  - Python version mismatch between local and runner.
  - `pytest` collecting zero tests (missing `__init__.py` or wrong
    `testpaths`).
  - flake8 failing on line length when local passed (different config
    being picked up).
  - Pages deploy failing with 403 → missing `permissions:` block.
  - Pages deploy succeeding but URL 404 → Source not set to "GitHub
    Actions" in repo settings.
  - Artifact upload succeeded but artifact is empty → wrong `path:`.
  - Workflow doesn't trigger on PR → branch filter excludes the
    target branch.

## Implementation order

Step 1: Repo scaffolding
  - Create `.gitignore`, `README.md`.
  - Initialize layout (`templates/`, `static/`, `tests/`,
    `.github/workflows/`).

Step 2: Flask Phase 1 app
  - `app.py` with a single `/` route rendering `index.html`.
  - Calculator UI: digit buttons 0-9, operator buttons (+ - x /),
    equals, clear, and a display. No JavaScript logic yet — buttons
    are present but inert. (Phase 2 wires them up.)
  - `style.css` for a usable grid layout.

Step 3: Lint / test / build wiring
  - `.flake8` config (line length 100, ignore E203/W503).
  - `requirements.txt` pinned to compatible versions.
  - `tests/test_app.py` — three tests: `/` returns 200, response
    contains the display element, response contains all expected
    button labels.
  - `freeze.py` script using Frozen-Flask to emit `build/` directory.
  - Cross-platform script runner: `scripts.ps1` (Windows) and
    `scripts.sh` (Linux runner). Each exposes `lint`, `test`, `build`.

Step 4: GitHub Actions workflow
  - `.github/workflows/ci.yml`:
    - `on: [push, pull_request]`.
    - Job `validate`: checkout, setup-python, install deps, lint,
      test, build, upload-artifact.
    - Job `deploy` (runs only on push to `main`, `needs: validate`):
      download artifact, deploy to GitHub Pages via
      `actions/deploy-pages`.

Step 5: Documentation
  - `systemrequirements.md` written first (reader needs this to start).
  - `GithubActionsCI.md` written in this order:
    1. Prerequisites block.
    2. Concepts primer.
    3. Sections 1-9.
    4. Section 10 (Deployment) with explicit Pages permissions and
       Source-setting coverage.
    5. Section 11.
    6. Appendix A: Workflow structure diagram.
    7. Appendix B: Troubleshooting table.
  - Screenshot placeholders inserted at every point where a reader
    would benefit from visual confirmation (GitHub UI screens, terminal
    output, Actions tab, artifact download, Pages settings, etc.).

Step 6: Phase 2 stub
  - `phase2-todo.md` describing exactly what Phase 2 adds (arithmetic
    evaluation, either client-side JS or a Flask `/calculate`
    endpoint), and noting that pushing this work later is the
    intended trigger for a real CI/CD run captured in screenshots.

Step 7: Tracking template
  - `checklist-template.csv` with columns: `Section`, `Step`,
    `Action`, `Status`, `Owner`, `Date`, `Screenshot Link`, `Notes`.
  - Pre-populated with rows mirroring the 11 documentation sections.
  - Instructions in the doc for importing into Google Sheets
    (`File > Import > Upload > Replace spreadsheet`).

## Google Sheet template — what I can and cannot do

I cannot create a live Google Sheet from this environment — that
requires Google Drive API access and authenticated credentials, which
this session does not have. What I can do, and will:

- Produce `checklist-template.csv` locally.
- Document the two-step import in `GithubActionsCI.md`:
  1. `File > Import > Upload > select checklist-template.csv >
     Import location: Replace spreadsheet > Import data`.
  2. Freeze the header row and apply a filter.

If you want a hosted Google Sheet link, you'll need to do the import
yourself (about 30 seconds) — there's no API path I can take from here.

## Phase 1 vs Phase 2 — clear boundary

| Concern         | Phase 1 (now)                          | Phase 2 (later)                              |
| --------------- | -------------------------------------- | -------------------------------------------- |
| UI              | Full layout, buttons, display          | Same                                         |
| Arithmetic      | None — buttons inert                   | Client-side JS or Flask `/calculate` route   |
| Tests           | UI route + element presence            | Add arithmetic-logic tests                   |
| CI pipeline     | Fully working green pipeline           | Same pipeline, demonstrates on a real change |
| Deploy          | Static UI to GitHub Pages              | Re-evaluate if backend route added           |

Phase 2 is deliberately left for the user to implement later so the
documented CI/CD flow can be exercised on a real code change (which is
the explicit point of the proof-of-concept).

## File tree at completion

```
GithubActionsPOC/
  .github/
    workflows/
      ci.yml
  static/
    style.css
  templates/
    index.html
  tests/
    test_app.py
  app.py
  freeze.py
  requirements.txt
  .flake8
  .gitignore
  scripts.ps1
  scripts.sh
  README.md
  Plan.md
  systemrequirements.md
  GithubActionsCI.md
  phase2-todo.md
  checklist-template.csv
```

## Honest limitation: screenshots

The doc is fully *followable* using the text instructions alone, but
it is only fully *teachable* once real screenshots are dropped into
the placeholder locations. GitHub's UI also drifts every 6-12 months,
so screenshots will go stale — the text instructions are what stays
correct. The placeholders make the capture work obvious; the reader
(or you) will need to do that capture pass after the docs are written.

## Open questions for you before I implement

None blocking. Two confirmable defaults:

- Branch names: `main` + `develop`. (Alternative: `main` + feature
  branches only, no `develop`.)
- Lint tool: `flake8`. (Alternative: `ruff` — faster, fewer config
  files. Flake8 is more commonly demonstrated in tutorials.)

Tell me to proceed and I will implement Steps 1-7 in order. If you
want either default changed, say so and I will adjust before starting.

## Ready to implement

Yes. Awaiting your go-ahead.
