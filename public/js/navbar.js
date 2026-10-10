/*
 * public/js/navbar.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Handles the user dropdown menu, swapping the hamburger icon for a
 *   close/cross icon when opened. Search-field styling is handled by CSS.
 *
 * USED ON: views/includes/navbar.ejs (loaded on every page)
 * ---------------------------------------------------------------------------
 */

"use strict";

// User button click then display Profile box----------

const imgBar = document.querySelector("#png-img-bar");
const crossBar = document.querySelector("#png-img-cross");
const userFnx = document.querySelector(".user-fnx");
const userButton = document.querySelector(".nav-user");

if (userButton && userFnx && imgBar && crossBar) {

    let menuOpen = userFnx.style.display !== "none";

    const updateMenuState = (open) => {

        menuOpen = open;

        userFnx.style.display = open ? "flex" : "none";
        userFnx.classList.toggle("is-open", open);
        imgBar.style.display = open ? "none" : "inline";
        crossBar.style.display = open ? "inline" : "none";

        userButton.setAttribute(
            "aria-expanded",
            String(open)
        );

    };

    userButton.setAttribute(
        "aria-expanded",
        String(menuOpen)
    );

    userButton.addEventListener("click", () => {
        updateMenuState(!menuOpen);
    });

    userButton.addEventListener("keydown", (event) => {

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            userButton.click();
        }

        if (event.key === "Escape") {
            event.preventDefault();
            updateMenuState(false);
            userButton.focus();
        }

    });

    // Close the dropdown when clicking outside the navbar menu.
    document.addEventListener("click", (event) => {

        if (
            menuOpen &&
            !userButton.contains(event.target) &&
            !userFnx.contains(event.target)
        ) {
            updateMenuState(false);
        }

    });

    // Close the dropdown with the Escape key.
    document.addEventListener("keydown", (event) => {

        if (menuOpen && event.key === "Escape") {
            updateMenuState(false);
            userButton.focus();
        }

    });

}
