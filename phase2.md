# Phase 2 - Implementation Walkthrough

This is the step-by-step guide for implementing Phase 2 (the
arithmetic logic) on top of the Phase 1 calculator. Phase 1 shipped
the UI with inert buttons; Phase 2 makes the calculator calculate.

The point of doing this is not just the feature - it is to push a real
code change through the CI/CD pipeline you built in
`GithubActionsCI.md` and watch it run end to end.

Screenshot placeholders are written as HTML comments such as
`<!-- SCREENSHOT: ... -->`. Wherever you see one, capture the screen
described and replace the comment with `![caption](path/to/image.png)`.

---

## 0. Choose your implementation path

### Why this matters

There are two ways to add the arithmetic, and they have different
consequences for testing and deployment. Decide before you start.

| | Option A: client-side JS | Option B: server-side Flask |
| --- | --- | --- |
| Where the math runs | In the browser | In Flask, via a `/calculate` endpoint |
| Files changed | `static/calculator.js`, `templates/index.html` | `app.py`, `static/calculator.js`, `templates/index.html` |
| Works on GitHub Pages | Yes | No - Pages cannot run Python |
| Unit-testable by pytest | No (logic is in JS) | Yes (test the Flask route) |
| Deploy target | Keep GitHub Pages | Switch to Render (see `GithubActionsCI.md` Section 10) |

**This guide leads with Option A** because it keeps the GitHub Pages
deploy you already have working. Option B is covered in Appendix A.

<!-- SCREENSHOT: This decision table, or a note in your project log
recording which option you chose. Caption: "Phase 2 implementation
path chosen." -->

---

## 1. Create the feature branch

### Why this matters

All Phase 2 work happens on a feature branch so the change flows
through a pull request - which is what triggers the PR check in your
pipeline.

1. Make sure `develop` is current:

   ```
   git checkout develop
   git pull origin develop
   ```

2. Create the Phase 2 feature branch:

   ```
   git checkout -b feature/phase-2-arithmetic
   ```

<!-- SCREENSHOT: Terminal showing the new feature branch checked out
(git status reporting "On branch feature/phase-2-arithmetic").
Caption: "Phase 2 feature branch created." -->

---

## 2. Add the arithmetic logic (Option A)

### Why this matters

This is the actual feature. The script reads button clicks, tracks the
running calculation, and updates the display. Order of operations is
left-to-right (no operator precedence) - the standard behavior for a
simple calculator. Division by zero shows `Error` instead of crashing.

### Create `static/calculator.js`

Create a new file `static/calculator.js` with this content:

```javascript
(function () {
    "use strict";

    var display = document.getElementById("display");

    var state = {
        displayValue: "0",
        firstOperand: null,
        operator: null,
        waitingForSecondOperand: false
    };

    function refresh() {
        display.value = state.displayValue;
    }

    function inputDigit(digit) {
        if (state.waitingForSecondOperand) {
            state.displayValue = digit;
            state.waitingForSecondOperand = false;
        } else {
            state.displayValue =
                state.displayValue === "0" ? digit : state.displayValue + digit;
        }
    }

    function inputDecimal() {
        if (state.waitingForSecondOperand) {
            state.displayValue = "0.";
            state.waitingForSecondOperand = false;
            return;
        }
        if (state.displayValue.indexOf(".") === -1) {
            state.displayValue += ".";
        }
    }

    function calculate(first, second, operator) {
        switch (operator) {
            case "add": return first + second;
            case "subtract": return first - second;
            case "multiply": return first * second;
            case "divide": return second === 0 ? null : first / second;
            default: return second;
        }
    }

    function handleOperator(nextOperator) {
        var inputValue = parseFloat(state.displayValue);

        if (state.operator && state.waitingForSecondOperand) {
            state.operator = nextOperator;
            return;
        }

        if (state.firstOperand === null) {
            state.firstOperand = inputValue;
        } else if (state.operator) {
            var result = calculate(state.firstOperand, inputValue, state.operator);
            if (result === null) {
                clearAll();
                state.displayValue = "Error";
                return;
            }
            state.displayValue = String(result);
            state.firstOperand = result;
        }

        state.operator = nextOperator;
        state.waitingForSecondOperand = true;
    }

    function handleEquals() {
        if (state.operator === null || state.waitingForSecondOperand) {
            return;
        }
        var result = calculate(
            state.firstOperand, parseFloat(state.displayValue), state.operator);
        state.displayValue = result === null ? "Error" : String(result);
        state.firstOperand = null;
        state.operator = null;
        state.waitingForSecondOperand = false;
    }

    function clearAll() {
        state.displayValue = "0";
        state.firstOperand = null;
        state.operator = null;
        state.waitingForSecondOperand = false;
    }

    function backspace() {
        if (state.displayValue === "Error") {
            clearAll();
            return;
        }
        state.displayValue =
            state.displayValue.length <= 1 ? "0" : state.displayValue.slice(0, -1);
    }

    function handleKey(key) {
        if (state.displayValue === "Error" && key !== "clear") {
            clearAll();
        }
        if (/^[0-9]$/.test(key)) {
            inputDigit(key);
        } else if (key === "decimal") {
            inputDecimal();
        } else if (key === "clear") {
            clearAll();
        } else if (key === "backspace") {
            backspace();
        } else if (key === "equals") {
            handleEquals();
        } else {
            handleOperator(key);
        }
        refresh();
    }

    document.querySelectorAll(".btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            handleKey(btn.getAttribute("data-key"));
        });
    });

    refresh();
})();
```

### Wire the script into the page

Open `templates/index.html` and add the script tag just before the
closing `</body>` tag:

```html
    <script src="{{ url_for('static', filename='calculator.js') }}"></script>
</body>
```

Optionally remove or update the Phase 1 note paragraph
(`<p class="phase-note">...`) since the arithmetic now works.

<!-- SCREENSHOT: Editor showing static/calculator.js created and the
new script tag in index.html. Caption: "Phase 2 arithmetic wired in." -->

---

## 3. Update the tests

### Why this matters

Your CI runs `pytest`. With Option A the arithmetic lives in
JavaScript, which pytest cannot execute. What pytest can and should
verify is that the page now references the script - so a broken wiring
fails the build. (Testing the JS math itself would need a JavaScript
test runner such as Jest, which would change the pipeline and is out
of scope here.)

Add this test to `tests/test_app.py`:

```python
def test_index_references_calculator_script(client):
    response = client.get("/")
    body = response.get_data(as_text=True)
    assert "calculator.js" in body
```

If you want true unit tests of the arithmetic, use Option B
(Appendix A) - the math moves into Flask and pytest can test it
directly.

<!-- SCREENSHOT: Editor showing the new test added to test_app.py.
Caption: "Test asserting the calculator script is wired up." -->

---

## 4. Validate locally

### Why this matters

Confirm the change is green on your machine before pushing. The
pipeline runs the exact same commands - if they fail here, they fail
in CI.

1. Activate your virtual environment (if not already active):

   - Windows PowerShell: `.\.venv\Scripts\Activate.ps1`
   - macOS/Linux: `source .venv/bin/activate`

2. Run the full suite:

   ```
   .\scripts.ps1 all        # Windows
   ./scripts.sh all         # macOS/Linux
   ```

   This runs lint, then tests, then build. All three must pass.

3. Manually check the calculator in a browser:

   ```
   python app.py
   ```

   Open http://127.0.0.1:5000, then test: `7 + 8 = 15`, `9 / 0 = Error`,
   clear, backspace, and a chained calculation like `2 + 3 x 4`
   (left-to-right gives `20`).

<!-- SCREENSHOT: Terminal showing scripts all run green, plus the
browser with a completed calculation. Caption: "Phase 2 passing
locally." -->

---

## 5. Commit and push the branch

### Why this matters

Pushing the feature branch makes it available on GitHub so you can open
a pull request.

```
git add static/calculator.js templates/index.html tests/test_app.py
git commit -m "Add Phase 2 arithmetic logic (client-side)"
git push -u origin feature/phase-2-arithmetic
```

<!-- SCREENSHOT: Terminal showing the successful push and the GitHub
"create a pull request" hint URL. Caption: "Feature branch pushed." -->

---

## 6. Open a pull request into develop

### Why this matters

The pull request is what triggers your `pull_request` workflow. This
is the CI-as-a-gate moment - the check must be green before you merge.

1. Open the repository on GitHub. It will prompt you to open a PR from
   `feature/phase-2-arithmetic`. Click `Compare & pull request`.
2. Set the base branch to `develop`.
3. Give it a title and description, then `Create pull request`.
4. Scroll to the checks section at the bottom. The CI workflow runs
   automatically.

<!-- SCREENSHOT: Open pull request page with the CI check running or
passed at the bottom. Caption: "CI running as a PR check on Phase 2." -->

---

## 7. Confirm the PR check, then merge to develop

### Why this matters

A green check confirms lint, tests, and build all passed against the
Phase 2 change on a clean runner.

1. Wait for the check to complete. If it fails, open the run, read the
   failing step's log (see `GithubActionsCI.md` Section 9 and Appendix
   B), fix locally, commit, and push - the PR re-runs automatically.
2. Once green, click `Merge pull request`, then `Confirm merge`.

<!-- SCREENSHOT: PR page showing the green check and the Merge button.
Caption: "Phase 2 PR passing and ready to merge into develop." -->

---

## 8. Promote develop to main and deploy

### Why this matters

The deploy job only runs on a push to `main`. Promoting `develop` to
`main` is what triggers the live deployment.

1. Open a new pull request from `develop` into `main` (or merge
   locally and push):

   ```
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

2. Open the `Actions` tab and watch the run. Both `validate` and the
   deploy job should run; the deploy job runs only because this is a
   push to `main`.

<!-- SCREENSHOT: Actions tab showing validate and deploy jobs green for
the push to main. Caption: "Phase 2 deployed via the pipeline." -->

---

## 9. Validate the live deployment

### Why this matters

A green deploy job is not proof - you must use the live site.

1. Open the deployed URL (GitHub Pages:
   `https://aws-thomas.github.io/GithubActionsPOC/`; or your Render
   URL if you switched).
2. Perform a few calculations. The buttons that were inert in Phase 1
   now produce results.
3. Confirm division by zero shows `Error`.

<!-- SCREENSHOT: The live deployed calculator performing a calculation
in the browser, URL bar visible. Caption: "Phase 2 arithmetic working
in production." -->

You have now driven a real feature change through the full CI/CD
pipeline - the demonstration this proof of concept was built for.

---

## Appendix A: Option B (server-side Flask)

Use this only if you want the arithmetic to run in Flask and be
unit-tested by pytest. It requires switching the deploy target away
from GitHub Pages (Pages cannot run Python) - see `GithubActionsCI.md`
Section 10, "Deployment alternative: Render".

### A.1 Add the endpoint to `app.py`

```python
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/calculate", methods=["POST"])
def calculate():
    data = request.get_json(silent=True) or {}
    a = data.get("a")
    b = data.get("b")
    op = data.get("op")

    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        return jsonify(error="invalid operands"), 400

    if op == "add":
        result = a + b
    elif op == "subtract":
        result = a - b
    elif op == "multiply":
        result = a * b
    elif op == "divide":
        if b == 0:
            return jsonify(error="division by zero"), 400
        result = a / b
    else:
        return jsonify(error="unknown operator"), 400

    return jsonify(result=result)


if __name__ == "__main__":
    app.run(debug=True)
```

### A.2 Add real pytest tests

```python
def test_calculate_add(client):
    response = client.post("/calculate", json={"a": 7, "b": 8, "op": "add"})
    assert response.status_code == 200
    assert response.get_json()["result"] == 15


def test_calculate_divide_by_zero(client):
    response = client.post("/calculate", json={"a": 1, "b": 0, "op": "divide"})
    assert response.status_code == 400
    assert "error" in response.get_json()
```

### A.3 Front-end and deploy changes

- `static/calculator.js` calls `fetch("/calculate", { method: "POST",
  ... })` instead of doing the math locally.
- Add `gunicorn==23.0.0` to `requirements.txt`.
- Switch the deploy to a Render Web Service (start command
  `gunicorn app:app`) as documented in `GithubActionsCI.md` Section 10.

Everything else - branch flow, PR check, validation - is identical to
the Option A steps above.

---

## What not to change

Keep the demonstration honest by leaving the pipeline plumbing alone:

- Do not edit `.github/workflows/ci.yml` unless you switch deploy
  targets (Option B).
- Do not change the branch structure.
- Do not change the script entry points (`lint`, `test`, `build`).

The whole point is to push a code change through the existing
pipeline.
