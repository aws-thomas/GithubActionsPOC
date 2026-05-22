# GitHub Actions CI/CD: A Hands-On Proof of Concept

This document proves that a GitHub Actions workflow can, on every
`push` and `pull_request`:

1. Install project dependencies.
2. Run linting.
3. Run unit tests.
4. Build the application.
5. Save build artifacts.
6. Optionally deploy to GitHub Pages.

It walks through the entire setup using a small Flask calculator app
(Phase 1: UI only). When you later implement Phase 2 (the arithmetic
logic), pushing that change exercises the same pipeline on a real code
change.


## Prerequisites

Before reading section 1, you must have:

- A **GitHub account** (free tier is fine).
- **Git** installed and configured locally with your name and email.
  See `systemrequirements.md` for verification commands.
- **Comfort with a terminal** - running commands, changing directory,
  viewing files. If you are brand new to Git, do a one-hour tutorial
  first (https://docs.github.com/get-started/quickstart/hello-world).
- **Every application in `systemrequirements.md`** installed and
  verified.
- **A new empty GitHub repository created** for this work. Create one
  at https://github.com/new (suggested name: `github-actions-poc`).
  Leave the "Add a README" checkbox unticked - you will push files
  manually.

<!-- SCREENSHOT: GitHub's "Create a new repository" form with the name
filled in and initialization options left empty. Caption: "Creating
the empty GitHub repository." -->

---

## Concepts primer

A quick vocabulary list. These terms appear throughout the
documentation and inside the workflow YAML.

- **Workflow** - a YAML file under `.github/workflows/` that defines
  automation. A repository can have many workflows.
- **Event** - the thing that triggers a workflow. Common events:
  `push`, `pull_request`, `schedule`, `workflow_dispatch`.
- **Job** - a unit of work that runs on one virtual machine. Jobs run
  in parallel by default. Use `needs:` to make them sequential.
- **Step** - a single command or pre-built action inside a job. Steps
  run sequentially within their job.
- **Runner** - the virtual machine GitHub provisions to run a job.
  This POC uses `ubuntu-latest`.
- **Action** - a reusable step published by GitHub or the community.
  Examples: `actions/checkout`, `actions/setup-python`.
- **Artifact** - a file or directory uploaded from a job. Artifacts
  can be downloaded from the Actions UI or consumed by later jobs.

Read this list once, then keep reading. The YAML in section 4 will
make a lot more sense.

---

## 1. Prepare Repository

### Why this matters

A clear branch structure separates work-in-progress from production-
ready code and gives the CI pipeline meaningful triggers (run on every
push, but only deploy from `main`).

### Configure branch structure

This POC uses two long-lived branches:

- `main` - production branch. The deploy job runs only when code lands
  here.
- `develop` - integration branch. Feature branches merge here via pull
  request.

Run these commands in the project directory:

```
git init
git checkout -b main
git add .
git commit -m "Initial commit: project scaffolding"

git checkout -b develop
```

Connect the local repository to the GitHub repository you created in
the prerequisites:

```
git remote add origin https://github.com/<your-username>/github-actions-poc.git
git push -u origin main
git push -u origin develop
```

<!-- SCREENSHOT: GitHub repository page showing both branches in the
branch dropdown. Caption: "Both `main` and `develop` branches pushed
to GitHub." -->

Optional but recommended - protect the `main` branch so it can only be
updated through pull requests:

1. Open the repository on GitHub.
2. Go to `Settings > Branches > Add branch protection rule`.
3. Branch name pattern: `main`.
4. Tick `Require a pull request before merging`.
5. Save.

***If your repo is set to private visibility, this branch protection settings will ONLY BE ENFORCED with PAID GITHUB SERVICE!!!

<!-- SCREENSHOT: GitHub branch protection rule settings for `main`
with "Require a pull request before merging" enabled. Caption:
"Branch protection rule on `main`." -->

---

## 2. Configure Scripts

### Why this matters

A pipeline is only useful if the same commands work locally and in CI.
Defining your lint, test, and build scripts up front means CI is just
"run these scripts on a clean machine."

### Add lint script

Linting is handled by `flake8`. Configuration lives in `.flake8`:

```ini
[flake8]
max-line-length = 100
extend-ignore = E203, W503
exclude =
    .git,
    __pycache__,
    venv,
    .venv,
    build,
    dist
```

**exclude means flake8 will not scan them
**extend-ignore means these error codes will be ignored 
E203 Error: E203 whitespace before ':'
W503

Error W503: line break before binary operator
Example:

result = (
    a
    + b
)

The script that runs it (Windows):

**These are local scripts
```powershell
# scripts.ps1 (excerpt)
function Invoke-Lint {
    python -m flake8 app.py freeze.py tests
}
```

**These are local scripts
The script that runs it (Linux/macOS):

```bash
# scripts.sh (excerpt)
run_lint() {
    python -m flake8 app.py freeze.py tests
}
```

### Add test script

Tests live in `tests/test_app.py` and run with `pytest`.

```powershell
# scripts.ps1 (excerpt)
function Invoke-Test {
    python -m pytest -v
}
```

```bash
# scripts.sh (excerpt)
run_test() {
    python -m pytest -v
}
```

### Add build script

The "build" freezes the Flask app to static HTML so the output can be
both archived as a CI artifact and deployed to GitHub Pages. The
freezing logic lives in `freeze.py`:

```python
from flask_frozen import Freezer
from app import app

app.config["FREEZER_DESTINATION"] = "build"
app.config["FREEZER_RELATIVE_URLS"] = True

freezer = Freezer(app)

if __name__ == "__main__":
    freezer.freeze()
```

The script that invokes it:

```powershell
# scripts.ps1 (excerpt)
function Invoke-Build {
    if (Test-Path build) { Remove-Item -Recurse -Force build }
    python freeze.py
}
```

```bash
# scripts.sh (excerpt)
run_build() {
    rm -rf build
    python freeze.py
}
```

---

## 3. Validate Local Execution

### Why this matters

If the scripts do not work on your machine, they will not work on the
CI runner either. Validate locally first.

### Set up a virtual environment

```
python -m venv .venv
```

Activate it:

- Windows PowerShell: `.\.venv\Scripts\Activate.ps1`
- macOS/Linux: `source .venv/bin/activate`

Install dependencies:

```
pip install -r requirements.txt
```

### Run lint locally

```
.\scripts.ps1 lint        # Windows
./scripts.sh lint         # macOS/Linux
```

Expected output: no errors, exit code 0.

<!-- SCREENSHOT: Terminal showing flake8 run with no errors. Caption:
"Lint passing locally." -->

### Run tests locally

```
.\scripts.ps1 test
./scripts.sh test
```

Expected output: four tests pass.

<!-- SCREENSHOT: Terminal showing pytest output with four passing
tests. Caption: "Unit tests passing locally." -->

### Run build locally

```
.\scripts.ps1 build
./scripts.sh build
```

A `build/` directory appears containing `index.html`, `static/`, etc.
Open `build/index.html` in a browser to confirm the static output
renders.

<!-- SCREENSHOT: File explorer showing the `build/` directory contents
and the calculator UI rendered from `build/index.html`. Caption:
"Static build output renders correctly." -->

---

## 4. Create Workflow Structure

### Why this matters

GitHub looks in a fixed location (`.github/workflows/`) for workflow
files. Anything outside that path is ignored.

### Create `.github/workflows`

```
mkdir -p .github/workflows
```

(On Windows PowerShell: `New-Item -ItemType Directory -Force
.github\workflows`.)

### Create CI workflow YAML file

Create `.github/workflows/ci.yml`. The minimal skeleton:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Workflow scaffolding works."
```

Commit and push this file. Then open the `Actions` tab on GitHub to
confirm the workflow appears.

<!-- SCREENSHOT: GitHub Actions tab showing the "CI" workflow listed
with its first run. Caption: "Workflow registered and triggered by the
initial push." -->

---

## 5. Configure CI Pipeline

### Why this matters

Every CI run starts from an empty machine. You must explicitly check
out the code, set up the runtime, and install dependencies before
running any of your own commands.

### Configure checkout action

Adds the repository files to the runner's workspace.

```yaml
- name: Checkout repository
  uses: actions/checkout@v4
```

### Configure runtime setup

Installs the requested Python version and enables `pip` caching for
faster reruns.

```yaml
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.12"
    cache: pip
```

### Configure dependency installation

```yaml
- name: Install dependencies
  run: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt
```

---

## 6. Configure Validation Steps

### Why this matters

These are the steps that decide whether the change is safe. If any
fail, the workflow run is marked red and (when configured) blocks PR
merges.

### Add lint step

```yaml
- name: Lint with flake8
  run: python -m flake8 app.py freeze.py tests
```

### Add test step

```yaml
- name: Run unit tests
  run: python -m pytest -v
```

### Add build step

```yaml
- name: Build static site
  run: python freeze.py
```

<!-- SCREENSHOT: GitHub Actions run detail page showing the three
green checkmarks for lint, test, and build steps. Caption: "All three
validation steps passing." -->

---

## 7. Configure Artifact Handling

### Why this matters

Artifacts let you download the exact build output produced by CI -
useful for debugging, manual deploys, or handing off to another job.

### Upload build artifacts

```yaml
- name: Upload build artifact
  uses: actions/upload-artifact@v4
  with:
    name: calculator-build
    path: build/
    if-no-files-found: error
    retention-days: 7
```

`if-no-files-found: error` causes the workflow to fail loudly if
`build/` is empty - that almost always means the build step silently
broke.

### Validate downloadable artifacts

After the workflow completes:

1. Open the workflow run on GitHub.
2. Scroll to the `Artifacts` section at the bottom.
3. Click `calculator-build` to download the zip.
4. Unzip and open `index.html` in a browser - the calculator UI
   should render.

<!-- SCREENSHOT: GitHub Actions run summary page with the
`calculator-build` artifact visible and download button highlighted.
Caption: "Build artifact available for download." -->

---

## 8. Trigger Workflow

### Why this matters

Triggers are how the pipeline actually runs. This POC uses two:
`push` and `pull_request`. You should see both in action.

### Push code changes

Any commit pushed to `main` or `develop` triggers a run:

```
git add .
git commit -m "Trigger CI on push"
git push origin develop
```

Open the `Actions` tab. A new run with your commit message appears.

<!-- SCREENSHOT: GitHub Actions tab showing the new run triggered by
the push, with status "in progress". Caption: "Workflow triggered by
push to `develop`." -->

### Trigger pull request workflow

1. Create a feature branch and push a change:

   ```
   git checkout -b feature/demo-change
   echo "# demo" >> README.md
   git commit -am "Demo change for PR trigger"
   git push -u origin feature/demo-change
   ```

2. Open GitHub. It will prompt you to open a pull request from
   `feature/demo-change` into `develop`. Open it.

3. The CI workflow runs automatically as a required check on the PR.

<!-- SCREENSHOT: Open pull request page showing the CI check running
or completed at the bottom. Caption: "CI workflow runs as a PR
check." -->

---

## 9. Validate Results

### Why this matters

A green pipeline tells you the pipeline ran. A red pipeline tells you
something is wrong - your job is to read the logs and fix it.

### Review workflow logs

1. Open the workflow run from the `Actions` tab.
2. Click the failing job (or any job to inspect).
3. Each step is collapsible. Click a red step to see its log.

<!-- SCREENSHOT: Expanded log view for a single failed step showing
the error message. Caption: "Inspecting a failing step's log." -->

### Fix failed jobs

Common failure patterns and where to look:

- **Lint failed** - rerun `python -m flake8 ...` locally, fix the
  issues, commit, push.
- **Tests failed** - rerun `python -m pytest -v` locally, fix, push.
- **Build failed** - rerun `python freeze.py` locally and read the
  traceback.
- **Setup-Python failed** - check the requested version is available.

See Appendix B for the most common gotchas.

### Confirm successful pipeline execution

A successful run shows:

- Green checkmarks on every job.
- The `calculator-build` artifact attached to the run.
- (On `main` only) a `deploy` job that completed.

<!-- SCREENSHOT: Workflow run summary with all jobs green and the
artifact attached. Caption: "Pipeline fully green." -->

---

## 10. Configure Deployment

### Why this matters

A pipeline that builds but does not deploy is half a pipeline. The
GitHub Pages deploy step closes the loop by publishing the freshly-
built site to a real URL.

### Set up GitHub Pages

GitHub Pages has two source modes. **Use the new "GitHub Actions"
mode**, not the older "Deploy from a branch" mode (many tutorials
online still show the old flow - they will not work with this
workflow).

1. On your repository, go to `Settings > Pages`.
2. Under `Build and deployment > Source`, choose `GitHub Actions`.
3. Save (the page saves automatically).

<!-- SCREENSHOT: Repository `Settings > Pages` with Source set to
"GitHub Actions". Caption: "Pages source configured for GitHub Actions
deploys." -->

### Workflow permissions

The deploy job needs explicit permission to publish Pages and to use
GitHub's OIDC token. Add this block near the top of `ci.yml`:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

Also add a concurrency group so two pushes to `main` cannot deploy at
the same time:

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

### Add deployment workflow steps

The deploy uses three actions: `configure-pages` (implicit through
`upload-pages-artifact`), `upload-pages-artifact`, and `deploy-pages`.

In the `validate` job, after the regular `upload-artifact` step, add:

```yaml
- name: Upload Pages artifact
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  uses: actions/upload-pages-artifact@v3
  with:
    path: build/
```

Then add a second job that depends on `validate`:

```yaml
deploy:
  name: Deploy to GitHub Pages
  needs: validate
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  runs-on: ubuntu-latest
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  steps:
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

The `if:` conditionals make sure the deploy only runs on a `push` to
`main` (not on PRs, not on `develop`).

### Trigger the first deploy

```
git checkout main
git merge develop
git push origin main
```

<!-- SCREENSHOT: Actions tab showing both `validate` and `deploy` jobs
green for the push to `main`. Caption: "First successful deploy run." -->

### Deployment alternative: Render

GitHub Pages can only host static files. That is fine for Phase 1 and
for a Phase 2 that does arithmetic in client-side JavaScript. If Phase
2 instead adds a server-side Flask endpoint (see `phase2-todo.md`,
Option B), Pages cannot run it - you need a host that executes Python.
Render is a good free option for both cases. This section shows both.

Render has a free tier and does not require a credit card to start.
Free web services sleep after inactivity and take a few seconds to
wake on the next request - acceptable for a POC.

There are two ways to wire Render to your repository. Pick one.

#### Pattern A: Render auto-deploy (simplest)

Render watches your GitHub repo directly and redeploys on every push
to the branch you choose. No changes to `ci.yml` are needed. The
trade-off: Render deploys independently of your CI result, so a push
can deploy even if lint or tests would have failed. Fine for learning,
not ideal for real projects.

#### Pattern B: CI-gated deploy hook (recommended)

Here GitHub Actions runs lint, test, and build first, and only then
tells Render to deploy by calling a deploy hook. CI stays the gate.

1. Create the Render service (see the two service types below).
2. In the Render dashboard, open the service, go to
   `Settings > Deploy Hook`, and copy the hook URL. It looks like
   `https://api.render.com/deploy/srv-xxxx?key=yyyy`.
3. In your GitHub repository, go to
   `Settings > Secrets and variables > Actions > New repository
   secret`. Name it `RENDER_DEPLOY_HOOK_URL` and paste the URL.
4. Add a deploy job to `ci.yml` that runs after `validate`:

```yaml
deploy-render:
  name: Deploy to Render
  needs: validate
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  runs-on: ubuntu-latest
  steps:
    - name: Trigger Render deploy
      run: curl -fsSL "$RENDER_DEPLOY_HOOK_URL"
      env:
        RENDER_DEPLOY_HOOK_URL: ${{ secrets.RENDER_DEPLOY_HOOK_URL }}
```

The secret is never printed in logs because it is passed through an
environment variable, not inlined into the command.

<!-- SCREENSHOT: Render dashboard Settings page with the Deploy Hook
URL visible (blur the key). Caption: "Render deploy hook URL." -->

<!-- SCREENSHOT: GitHub repository Settings > Secrets and variables >
Actions showing the RENDER_DEPLOY_HOOK_URL secret saved. Caption:
"Deploy hook stored as a GitHub Actions secret." -->

#### Render service type 1: Static Site (Phase 1 / client-side Phase 2)

Deploys the frozen `build/` output - the same static files GitHub
Pages would serve.

1. In Render, click `New > Static Site` and connect your repository.
2. Configure:
   - Branch: `main`
   - Build Command: `pip install -r requirements.txt && python freeze.py`
   - Publish Directory: `build`
3. Click `Create Static Site`.

#### Render service type 2: Web Service (server-side Phase 2)

Runs the live Flask app via a production WSGI server. This is what you
use only if Phase 2 adds a Flask `/calculate` endpoint.

1. Add `gunicorn` to `requirements.txt`:
   ```
   gunicorn==23.0.0
   ```
2. In Render, click `New > Web Service` and connect your repository.
3. Configure:
   - Branch: `main`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
4. Click `Create Web Service`.

#### Optional: render.yaml (infrastructure as code)

Instead of clicking through the dashboard, commit a `render.yaml` to
the repo root and use Render Blueprints. Static-site example:

```yaml
services:
  - type: web
    name: calculator-static
    runtime: static
    buildCommand: pip install -r requirements.txt && python freeze.py
    staticPublishPath: build
    branch: main
```

Web-service example (server-side Phase 2):

```yaml
services:
  - type: web
    name: calculator-app
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    branch: main
```

#### Choosing between Pages and Render

- Staying static the whole way: GitHub Pages is the least setup.
- Want CI to gate the deploy: use Render Pattern B (or a Pages flow
  that, like this POC's, runs deploy only after `validate`).
- Phase 2 needs server-side Flask: Render Web Service is required;
  Pages cannot do it.

---

## 11. Validate Deployment

### Why this matters

A deploy that "succeeds" in the workflow but produces a 404 page is
not a deploy. You must visit the actual URL.

### Verify deployment URL

The deploy job's summary shows the published URL, for example:

```
https://<your-username>.github.io/github-actions-poc/
```

You can also find it under `Settings > Pages` after the first
successful deploy.

If you deployed to Render instead, the URL is shown at the top of the
service page in the Render dashboard, in the form
`https://<service-name>.onrender.com`. On a free web service, the
first request after idle takes a few seconds to wake.

<!-- SCREENSHOT: Deploy job summary card showing the live URL.
Caption: "Live URL surfaced by the deploy job." -->

### Confirm successful deployment

1. Open the URL in a browser.
2. The calculator UI should render exactly as it did in `build/`
   locally.
3. Buttons are inert (Phase 1) - that is expected. Phase 2 adds the
   arithmetic.

<!-- SCREENSHOT: The deployed calculator page rendered in a browser
with the URL bar showing the github.io address. Caption: "Deployed
Phase 1 calculator UI." -->

If the URL returns 404, see Appendix B (Troubleshooting).

---

## Appendix A: Workflow structure

```
ci.yml
  on:
    push          [branches: main, develop]
    pull_request  [branches: main, develop]

  permissions:
    contents: read
    pages: write
    id-token: write

  jobs:
    validate (ubuntu-latest)
      step 1: checkout
      step 2: setup-python (3.12, pip cache)
      step 3: pip install -r requirements.txt
      step 4: flake8        <-- VALIDATION
      step 5: pytest        <-- VALIDATION
      step 6: python freeze.py  <-- BUILD
      step 7: upload-artifact (calculator-build)
      step 8: upload-pages-artifact  [main + push only]

    deploy (ubuntu-latest)
      needs: validate
      condition: main + push only
      step 1: actions/deploy-pages
```

Key relationships:

- **Steps within a job run sequentially.** If one fails, later steps
  in the same job are skipped.
- **Jobs run in parallel by default.** `needs: validate` forces the
  deploy job to wait for `validate` to succeed.
- **Conditionals (`if:`) gate execution.** Both the Pages upload step
  and the entire deploy job are gated to "push to main."

---

## Appendix B: Troubleshooting

| Symptom                                              | Likely cause                                                             | Fix                                                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `YAML did not find expected key` on workflow load    | Indentation is mixed tabs/spaces or off by one level                     | Open `ci.yml` in an editor with YAML support; ensure 2-space indents, no tabs                        |
| Later steps say "file not found" for project files   | Missing `actions/checkout@v4` step                                       | Add the checkout step as the first step in the job                                                   |
| Tests pass locally, fail on CI with "module not found" | Python version mismatch                                                  | Set the same Python version in `setup-python` as you use locally                                     |
| `pytest` reports `collected 0 items`                 | Missing `tests/__init__.py`, or wrong `testpaths`, or filenames not `test_*.py` | Add `tests/__init__.py`; verify file names start with `test_`                                        |
| `flake8` fails on CI but passes locally              | Different `.flake8` config picked up (often a global one)                | Ensure `.flake8` is committed; run `flake8 --verbose` locally to see which config is loaded          |
| Deploy job fails with `403`                          | Missing `permissions:` block in workflow                                 | Add `permissions: { contents: read, pages: write, id-token: write }` at the workflow top level      |
| Deploy job succeeds but URL returns 404              | `Settings > Pages > Source` not set to "GitHub Actions"                  | In repo settings, switch Pages source to "GitHub Actions" and rerun the workflow                     |
| `upload-artifact` succeeds but artifact is empty     | Wrong `path:` (typo, or build wrote to a different directory)            | Confirm `build/` exists after the build step; match `path:` exactly                                  |
| Workflow does not run on a PR                        | `pull_request.branches` filter excludes the PR's base branch             | Add the base branch to the filter, or remove the `branches:` filter to run on every PR              |
| Frozen-Flask "url_for failed" during freeze          | A `url_for` call references an endpoint that no longer exists            | Run `python freeze.py` locally and read the traceback; remove or fix the offending `url_for`         |
| Tests fail with `ImportError: cannot import name 'app'` | `tests/` cannot find the project root on the Python path                 | Run `pytest` from the project root, not from inside `tests/`; verify `tests/__init__.py` exists      |

---

## Next steps

You now have a fully working CI/CD pipeline against a Phase 1 app.
Open `phase2-todo.md` and implement Phase 2 (arithmetic logic). When
you push that change, the pipeline you just built will run end to end
on a real code change - which is the entire point of this proof of
concept.
