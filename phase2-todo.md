# Phase 2 - Arithmetic Logic (Not Yet Implemented)

Phase 1 (this repository, current state) ships only the calculator
UI. Buttons are present but inert. Phase 2 wires them up so the
calculator actually calculates.

Phase 2 is left unimplemented on purpose. Implementing it later
produces a real code change you can push, which exercises the
documented CI/CD pipeline end to end on a non-trivial commit. That is
the entire point of this proof of concept.

## What Phase 2 must add

### Functional requirements

- Digit buttons (0-9) append to the display.
- Decimal button (`.`) appends a decimal point (only one per number).
- Operator buttons (`+`, `-`, `x`, `/`) record the operation.
- Equals button computes the result and shows it on the display.
- Clear button (`C`) resets the display to `0`.
- Backspace button removes the last entered character.
- Division by zero shows `Error` on the display, not a crash.

### Where to add the code

There are two reasonable implementations. Pick one.

**Option A: client-side JavaScript**

- Add `static/calculator.js` and load it from `templates/index.html`
  with `<script src="{{ url_for('static', filename='calculator.js')
  }}"></script>` at the end of `<body>`.
- All logic runs in the browser - no Flask route changes needed.
- Pros: works on GitHub Pages without any backend.
- Cons: not really demonstrating Flask doing work.

**Option B: server-side Flask endpoint**

- Add a `/calculate` POST endpoint to `app.py` that accepts the
  current expression and returns the result as JSON.
- Add a small `static/calculator.js` that wires button clicks to
  `fetch('/calculate', ...)`.
- Pros: exercises Flask.
- Cons: GitHub Pages cannot host the backend - you would need to
  either keep deploys local, or switch the deploy target to a host
  like Render or Fly.io. Update `GithubActionsCI.md` section 10
  accordingly.

## Tests Phase 2 should add

Append to `tests/test_app.py`:

- Adding two positive integers returns the correct sum.
- Subtracting produces the correct result, including negative output.
- Multiplying handles zero correctly.
- Dividing by zero returns the `Error` sentinel.
- Chained operations (e.g. `2 + 3 x 4`) follow whichever order of
  operations you specified - document the choice.
- Clear and backspace produce the expected display state.

If you go with Option B, add request-level tests using Flask's test
client (the existing tests show the pattern).

## What Phase 2 must NOT change

- The CI workflow file, unless you change the deploy target.
- The branch structure.
- The lint or test script signatures (`scripts.ps1 lint`,
  `scripts.ps1 test`, `scripts.ps1 build`).

The point of Phase 2 is to push a code change through the existing
pipeline. Changing the pipeline itself defeats the demonstration.

## Suggested workflow for implementing Phase 2

1. Create a feature branch from `develop`:
   ```
   git checkout develop
   git pull
   git checkout -b feature/phase-2-arithmetic
   ```
2. Implement the logic and tests.
3. Run the full suite locally:
   ```
   .\scripts.ps1 all
   ```
4. Commit and push the branch.
5. Open a pull request from `feature/phase-2-arithmetic` into
   `develop`. Watch the CI workflow run as a PR check.
6. Once green, merge to `develop`.
7. Open a PR from `develop` into `main`. Merge it.
8. Watch the deploy job run and check the deployed URL.

Capture screenshots at each step for the documentation. This is the
"real CI/CD run" that the POC is designed to demonstrate.
