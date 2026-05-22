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