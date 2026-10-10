/*
 * public/js/like.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Persists the listing-card heart state for authenticated users through the
 *   listing favourites endpoints. Guests are sent to the login page.
 *
 * USED ON: views/listings/index.ejs (listing card grid)
 * ---------------------------------------------------------------------------
 */

"use strict";

const likeButtons = document.querySelectorAll(".heart");

const updateFavoriteState = (listingId, liked) => {
    document
        .querySelectorAll(`[data-favorite-id="${listingId}"]`)
        .forEach((button) => {
            const isRedHeart = button.classList.contains("heart-r");

            button.classList.toggle(
                "d-none",
                liked ? !isRedHeart : isRedHeart
            );
            button.setAttribute("aria-pressed", String(liked));
        });
};

// Iterate through each like button and add a click event listener
likeButtons.forEach((likeButton) => {
    likeButton.addEventListener("click", (event) => {
        // Prevent the heart click from opening the listing card/link.
        event.preventDefault();
        event.stopPropagation();

        const listingId = likeButton.dataset.favoriteId;

        if (!listingId) {
            return;
        }

        if (likeButton.dataset.authenticated !== "true") {
            window.location.href = "/login";
            return;
        }

        const liked = likeButton.classList.contains("heart-b");
        const method = liked ? "POST" : "DELETE";

        fetch(`/listings/${listingId}/favorite`, {
            method,
            credentials: "same-origin",
            headers: {
                Accept: "application/json",
            },
        })
            .then(async (response) => {
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Favourite update failed.");
                }

                return data;
            })
            .then((data) => updateFavoriteState(listingId, data.liked))
            .catch((error) => {
                console.error("Favourite update failed:", error.message);
            });
    });
});
