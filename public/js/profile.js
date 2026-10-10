/*
 * public/js/profile.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Toggles between the "My Listings" and "My Reviews" tabs on the profile
 *   dashboard by showing/hiding the two content sections.
 *
 * USED ON: views/profiles/profile.ejs
 * ---------------------------------------------------------------------------
 */

"use strict";

const listingBox = document.getElementById("listing-box");
const reviewBox = document.getElementById("review-box");

const listBtn = document.querySelector(
    ".choose-list #listBtn"
);

const reviBtn = document.querySelector(
    ".choose-list #reviBtn"
);

if (
    listingBox &&
    reviewBox &&
    listBtn &&
    reviBtn
) {
    const showListings = () => {
        listingBox.style.display = "block";
        reviewBox.style.display = "none";
        listBtn.setAttribute("aria-selected", "true");
        reviBtn.setAttribute("aria-selected", "false");
    };

    const showReviews = () => {
        listingBox.style.display = "none";
        reviewBox.style.display = "block";
        listBtn.setAttribute("aria-selected", "false");
        reviBtn.setAttribute("aria-selected", "true");
    };

    listBtn.addEventListener("change", () => {
        if (listBtn.checked) {
            showListings();
        }
    });

    reviBtn.addEventListener("change", () => {
        if (reviBtn.checked) {
            showReviews();
        }
    });

    // Listings tab is selected by default in profile.ejs.
    showListings();
}
