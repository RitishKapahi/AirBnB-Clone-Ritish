/*
 * public/js/password-toggle.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Provides an accessible show/hide control for password fields.
 * ---------------------------------------------------------------------------
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-password-toggle]").forEach((button) => {
        const targetId = button.getAttribute("data-password-toggle");
        const input = targetId
            ? document.getElementById(targetId)
            : null;
        const icon = button.querySelector("i");

        if (!input) {
            return;
        }

        button.addEventListener("click", () => {
            const isVisible = input.type === "text";

            input.type = isVisible ? "password" : "text";
            button.setAttribute(
                "aria-label",
                isVisible ? "Show password" : "Hide password"
            );
            button.setAttribute("aria-pressed", String(!isVisible));

            icon?.classList.toggle("fa-eye", isVisible);
            icon?.classList.toggle("fa-eye-slash", !isVisible);
        });
    });
});
