/*
 * public/js/flash.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Automatically dismisses one-time success/error alerts after a short,
 *   readable period while preserving the manual close button.
 * ---------------------------------------------------------------------------
 */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".flash-message").forEach((alert) => {
        const timeout = Number(alert.dataset.timeout) || 5000;
        let timer;

        const dismiss = () => {
            if (!alert.isConnected) {
                return;
            }

            alert.classList.remove("show");

            window.setTimeout(() => {
                alert.remove();
            }, 180);
        };

        const cancelTimer = () => {
            window.clearTimeout(timer);
        };

        timer = window.setTimeout(dismiss, timeout);

        alert.querySelector(".btn-close")?.addEventListener(
            "click",
            cancelTimer,
            { once: true }
        );
    });
});
