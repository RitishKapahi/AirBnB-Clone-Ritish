/*
 * public/js/image-preview.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Shows a live thumbnail preview of a chosen file before it's uploaded, by
 *   reading it into memory client-side (no server round-trip). Called
 *   directly from an `onchange="previewImage()"` attribute in the view.
 *
 * USED ON: views/listings/new.ejs, views/listings/edit.ejs,
 *           views/users/changeImage.ejs
 * ---------------------------------------------------------------------------
 */

"use strict";

let previewObjectUrl = null;

function previewImage() {

    const fileInput =
        document.getElementById("listingImage") ||
        document.getElementById("verify-img");

    const imagePreview = document.getElementById("imagePreview");

    if (!fileInput || !imagePreview) {
        return;
    }

    const file = fileInput.files[0];

    // Remove the previous preview object URL before creating a new one.
    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }

    if (!file) {
        clearPreview();
        return;
    }

    if (!file.type.startsWith("image/")) {
        clearPreview();
        return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrl = objectUrl;

    const previewImageElement =
        imagePreview.tagName === "IMG"
            ? imagePreview
            : document.createElement("img");

    previewImageElement.src = objectUrl;
    previewImageElement.alt = "Preview";
    previewImageElement.classList.remove("d-none");

    const releaseObjectUrl = () => {
        if (previewObjectUrl === objectUrl) {
            URL.revokeObjectURL(objectUrl);
            previewObjectUrl = null;
        }
    };

    // Once the image has loaded, the object URL is no longer required.
    previewImageElement.onload = releaseObjectUrl;

    previewImageElement.onerror = () => {
        releaseObjectUrl();
        clearPreview();
    };

    if (imagePreview.tagName !== "IMG") {
        imagePreview.innerHTML = "";
        imagePreview.appendChild(previewImageElement);
    }
}

function clearPreview() {
    if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        previewObjectUrl = null;
    }

    const imagePreview = document.getElementById("imagePreview");

    if (!imagePreview) {
        return;
    }

    if (imagePreview.tagName === "IMG") {
        imagePreview.removeAttribute("src");
        imagePreview.classList.add("d-none");
        return;
    }

    imagePreview.innerHTML = "";
}
