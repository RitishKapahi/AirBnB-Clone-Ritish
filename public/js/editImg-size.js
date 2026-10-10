/*
 * public/js/editImg-size.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Client-side guard on the "edit listing" image field. A replacement image
 *   is optional, but when one is selected it must match the same type and
 *   100KB size rules enforced by the server.
 *
 * USED ON: views/listings/edit.ejs
 * ---------------------------------------------------------------------------
 */

"use strict";

const fileInput = document.getElementById("listingImage");

const form = fileInput?.form;

if (fileInput && form) {

    const maxSize = 100 * 1024; // 100KB in bytes

    const allowedMimeTypes = new Set([
        "image/png",
        "image/jpeg",
    ]);

    const allowedExtensions = new Set([
        ".png",
        ".jpg",
        ".jpeg",
    ]);

    let errorContainer = document.getElementById(
        "listing-image-error"
    );

    if (!errorContainer) {
        errorContainer = document.createElement("div");
        errorContainer.id = "listing-image-error";
        errorContainer.className = "invalid-feedback";
        fileInput.insertAdjacentElement(
            "afterend",
            errorContainer
        );
    }

    const setError = (message) => {
        fileInput.setCustomValidity(message);
        errorContainer.textContent = message;
        errorContainer.style.display = message
            ? "block"
            : "none";
    };

    const validateImageFile = () => {
        // No replacement selected: preserve the existing listing image.
        if (fileInput.files.length === 0) {
            setError("");
            return true;
        }

        const file = fileInput.files[0];
        const extension = file.name
            .slice(file.name.lastIndexOf("."))
            .toLowerCase();

        if (!allowedMimeTypes.has(file.type)) {
            setError(
                "Only PNG, JPG, and JPEG images are allowed."
            );
            return false;
        }

        if (!allowedExtensions.has(extension)) {
            setError(
                "Only PNG, JPG, and JPEG images are allowed."
            );
            return false;
        }

        if (file.size > maxSize) {
            setError("File size exceeds the limit (100KB).");
            return false;
        }

        setError("");
        return true;
    };

    fileInput.addEventListener("change", validateImageFile);

    form.addEventListener("submit", (event) => {
        if (!validateImageFile()) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add("was-validated");
            fileInput.focus();
        }
    });
}
