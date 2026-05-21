# GitHub Actions POC - Flask Calculator

A proof-of-concept repository that demonstrates a full GitHub Actions
CI/CD pipeline (push and pull request triggers, dependency install,
lint, unit tests, build, artifact upload, and optional GitHub Pages
deployment) using a minimal Flask calculator application.

## Where to start

1. Read `systemrequirements.md` and install everything listed.
2. Read `GithubActionsCI.md` and follow it end to end.
3. Track your progress with `checklist-template.csv` (import into
   Google Sheets).

## Repository layout

```
.github/workflows/ci.yml   GitHub Actions pipeline
app.py                     Flask entrypoint
templates/index.html       Calculator UI (Phase 1)
static/style.css           UI styling
tests/test_app.py          Unit tests
freeze.py                  Frozen-Flask static build script
requirements.txt           Python dependencies
.flake8                    Lint configuration
scripts.ps1                Windows task runner (lint / test / build)
scripts.sh                 Linux task runner (lint / test / build)
Plan.md                    Implementation plan
GithubActionsCI.md         Main documentation
systemrequirements.md      Required local tools
phase2-todo.md             Work intentionally left unimplemented
checklist-template.csv     Google Sheets tracking template
```

## Phases

- **Phase 1 (this repository)**: UI only. Buttons are present but
  perform no arithmetic. The CI/CD pipeline is fully working.
- **Phase 2 (deliberately not implemented)**: arithmetic logic.
  Implementing it later produces a real code change that drives the
  pipeline end to end. See `phase2-todo.md`.
