"use strict";

document.addEventListener("DOMContentLoaded", () => {
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