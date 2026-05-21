# System Requirements

Install every item in this list before starting `GithubActionsCI.md`.
Versions listed are the ones this proof-of-concept was built against;
newer minor versions should work, but pin if you hit unexpected
behavior.

## Required applications

### 1. Python 3.12 or newer

The Flask application and all tooling (pytest, flake8, Frozen-Flask)
run on Python.

- Windows: download from https://www.python.org/downloads/windows/ and
  during install tick "Add python.exe to PATH".
- macOS: `brew install python@3.12`.
- Linux (Debian/Ubuntu): `sudo apt install python3.12 python3.12-venv
  python3-pip`.

Verify:

```
python --version
pip --version
```

Both commands must succeed and report version 3.12 or newer.

### 2. pip (bundled with Python)

`pip` ships with Python. Upgrade to the latest:

```
python -m pip install --upgrade pip
```

### 3. Git 2.30 or newer

Needed to version-control the project and push to GitHub.

- Windows: https://git-scm.com/download/win
- macOS: `brew install git`
- Linux: `sudo apt install git`

Configure once per machine:

```
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

Verify:

```
git --version
```

### 4. A GitHub account

Free tier is sufficient. Sign up at https://github.com if you do not
already have an account. Two-factor authentication is recommended.

### 5. GitHub authentication on your machine

You must be able to `git push` to GitHub. Choose one:

- **HTTPS + Personal Access Token (PAT)** - simplest for beginners.
  Create at https://github.com/settings/tokens (classic, scope `repo`).
  When `git push` prompts for a password, paste the token.
- **SSH keys** - generate once, more convenient long-term. Follow
  https://docs.github.com/authentication/connecting-to-github-with-ssh.
- **GitHub CLI** - `gh auth login` handles authentication for you.
  Install from https://cli.github.com.

Verify by cloning any repo you own and pushing an empty commit.

### 6. A code editor

Any editor works. Recommended:

- Visual Studio Code (https://code.visualstudio.com) with the Python
  and YAML extensions installed.
- PyCharm Community Edition.

### 7. A modern web browser

Used to view the running Flask app locally and the deployed GitHub
Pages URL.

- Chrome, Firefox, or Edge - any current version.

## Optional but recommended

### GitHub CLI (`gh`)

Lets you create the GitHub repository, trigger workflow runs, and view
logs from the terminal.

- Install: https://cli.github.com
- Authenticate: `gh auth login`

### A Google account

Only needed if you want to import `checklist-template.csv` into Google
Sheets as a progress tracker. Any free Google account works.

## Python packages (installed later by the docs)

These are installed via `pip install -r requirements.txt` in step 2 of
`GithubActionsCI.md` - you do not install them now.

- Flask 3.0.3
- Frozen-Flask 1.0.2
- pytest 8.3.3
- flake8 7.1.1

## Sanity check

Run all four commands. Each must print a version, not an error.

```
python --version
pip --version
git --version
```

If any fails, fix it before proceeding to `GithubActionsCI.md`.
