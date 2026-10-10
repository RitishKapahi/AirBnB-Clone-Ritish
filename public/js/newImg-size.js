/*
 * public/js/newImg-size.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Client-side guard for required image uploads. This file is shared by the
 *   new-listing form and the profile-image forms.
 *
 * USED ON: views/listings/new.ejs, views/users/update.ejs,
 *           views/users/changeImage.ejs
 * ---------------------------------------------------------------------------
 */

"use strict";

const fileInput =
    document.getElementById("listingImage") ||
    document.getElementById("verify-img");

const form = fileInput?.form;
const verifyInput = document.getElementById("verify");

if (fileInput && form) {
    const maxSize = 100 * 1024;

    const allowedMimeTypes = new Set([
        "image/png",
        "image/jpeg",
    ]);

    const allowedExtensions = new Set([
        ".png",
        ".jpg",
        ".jpeg",
    ]);

    let errorContainer = document.getElementById("errorContainer");

    if (!errorContainer) {
        errorContainer = document.createElement("div");
        errorContainer.id = "listing-image-error";
        errorContainer.className = "invalid-feedback";
        fileInput.insertAdjacentElement("afterend", errorContainer);
    }

    const setError = (message) => {
        fileInput.setCustomValidity(message);
        errorContainer.textContent = message;
        errorContainer.style.display = message ? "block" : "none";
    };

    const validateImageFile = () => {
        setError("");

        if (fileInput.files.length === 0) {
            setError("Please select an image to upload.");
            return false;
        }

        const file = fileInput.files[0];
        const extension = file.name
            .slice(file.name.lastIndexOf("."))
            .toLowerCase();

        if (
            !allowedMimeTypes.has(file.type) ||
            !allowedExtensions.has(extension)
        ) {
            setError("Only PNG, JPG, and JPEG images are allowed.");
            return false;
        }

        if (file.size > maxSize) {
            setError("File size exceeds the limit (100KB).");
            return false;
        }

        return true;
    };

    fileInput.addEventListener("change", () => {
        if (verifyInput) {
            verifyInput.checked = false;
            verifyInput.setCustomValidity("");
        }

        validateImageFile();
    });

    verifyInput?.addEventListener("change", () => {
        if (!verifyInput.checked) {
            verifyInput.setCustomValidity("");
            return;
        }

        if (!validateImageFile()) {
            verifyInput.checked = false;
            return;
        }

        verifyInput.setCustomValidity("");
    });

    form.addEventListener("submit", (event) => {
        const validImage = validateImageFile();
        const validVerification = !verifyInput || verifyInput.checked;

        if (!validVerification && verifyInput) {
            verifyInput.setCustomValidity("Please verify the selected image.");
        }

        if (!validImage || !validVerification) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add("was-validated");
        }
    });
}
