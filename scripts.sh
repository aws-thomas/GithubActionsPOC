#!/usr/bin/env bash
# Task runner for Linux / macOS.
# Usage: ./scripts.sh <lint|test|build|all>

set -euo pipefail

target="${1:-}"

run_lint() {
    echo "Running flake8..."
    python -m flake8 app.py freeze.py tests
}

run_test() {
    echo "Running pytest..."
    python -m pytest -v
}

run_build() {
    echo "Running Frozen-Flask build..."
    rm -rf build
    python freeze.py
}

case "$target" in
    lint)  run_lint ;;
    test)  run_test ;;
    build) run_build ;;
    all)   run_lint && run_test && run_build ;;
    *)
        echo "Usage: $0 <lint|test|build|all>"
        exit 1
        ;;
esac
