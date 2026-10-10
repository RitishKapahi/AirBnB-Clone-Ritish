/*
 * public/js/filterIcon.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Opens/closes the mobile "filters" panel (toggled by a filter icon
 *   button) and dims the rest of the page behind it while it's open.
 *   Defines two globals (`filterClick`/`closefilter`) called directly from
 *   `onclick="..."` attributes in the view markup.
 *
 * USED ON: views/listings/index.ejs, views/includes/filterbtn.ejs
 * ---------------------------------------------------------------------------
 */

"use strict";

const page = document.querySelector(".pageblur");

const containerbtn = document.querySelector(".showfilter");

const filterTriggerButtons = document.querySelectorAll(
    '[onclick="filterClick()"]'
);

const closeTriggerButtons = document.querySelectorAll(
    '[onclick="closefilter()"]'
);

// Called from an inline onclick handler to open the filter panel.
window.filterClick = () => {

    if (!page || !containerbtn) {
        return;
    }

    containerbtn.classList.add("filterbtnClick");
    page.classList.add("containerblur");

    filterTriggerButtons.forEach((button) => {
        button.setAttribute("aria-expanded", "true");
    });

};

// Called from an inline onclick handler to close the filter panel.
window.closefilter = () => {

    if (!page || !containerbtn) {
        return;
    }

    containerbtn.classList.remove("filterbtnClick");
    page.classList.remove("containerblur");

    filterTriggerButtons.forEach((button) => {
        button.setAttribute("aria-expanded", "false");
    });

};

// Keep close controls accessible and keyboard-friendly where applicable.
closeTriggerButtons.forEach((button) => {
    button.setAttribute("type", "button");
});