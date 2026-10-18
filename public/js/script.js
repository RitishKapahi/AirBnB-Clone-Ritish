"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const csrfToken = document.querySelector(
        'meta[name="csrf-token"]'
    )?.content;

    if (csrfToken) {
        document
            .querySelectorAll("form")
            .forEach((form) => {
                const method = (
                    form.getAttribute("method") || "get"
                ).toLowerCase();

                if (
                    method !== "get" &&
                    !form.querySelector('input[name="_csrf"]')
                ) {
                    const tokenInput = document.createElement("input");
                    tokenInput.type = "hidden";
                    tokenInput.name = "_csrf";
                    tokenInput.value = csrfToken;
                    form.appendChild(tokenInput);
                }
            });
    }

    const forms = document.querySelectorAll("form.needs-validation");

    forms.forEach((form) => {
        form.addEventListener("submit", (event) => {
            if (form.dataset.submitting === "true") {
                event.preventDefault();
                return;
            }

            form.classList.add("was-validated");

            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();

                const firstInvalid = form.querySelector(":invalid");

                if (firstInvalid) {
                    firstInvalid.focus();

                    firstInvalid.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }

                return;
            }

            form.dataset.submitting = "true";

            const submitButtons = form.querySelectorAll(
                'button[type="submit"], input[type="submit"]'
            );

            submitButtons.forEach((button) => {
                button.disabled = true;
                button.setAttribute("aria-busy", "true");
            });
        });
    });
});
