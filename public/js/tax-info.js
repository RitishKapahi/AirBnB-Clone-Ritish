/*
 * public/js/tax-info.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Toggles between showing a listing's raw nightly price and a "with taxes
 *   included" price display, driven by a switch/checkbox. Handles both the
 *   desktop switch (#flexSwitchCheckDefault) and a mobile variant
 *   (#flexSwitchCheckDefaultS) with identical logic.
 *
 * USED ON: views/listings/index.ejs
 * ---------------------------------------------------------------------------
 */

"use strict";

const taxSwitchs = document.querySelectorAll(
    "#flexSwitchCheckDefault"
);

const taxSwitchsS = document.querySelectorAll(
    "#flexSwitchCheckDefaultS"
);

const changeAfter = document.querySelectorAll(
    ".changeAfter"
); // helper text label, e.g. "Display total after taxes .."

function updateTaxDisplay(taxSwitch) {

    const taxInfo =
        document.getElementsByClassName("tax-info");

    const priceInfo =
        document.getElementsByClassName("price-info");

    const showTaxPrice = taxSwitch.checked;

    for (const tax of taxInfo) {
        tax.style.display = showTaxPrice
            ? "inline"
            : "none";
    }

    for (const price of priceInfo) {
        price.style.display = showTaxPrice
            ? "none"
            : "inline";
    }

    for (const changeA of changeAfter) {
        changeA.textContent = showTaxPrice
            ? "Total after taxes"
            : "Total before taxes";
    }

    // Keep the desktop and mobile switches synchronized.
    const allTaxSwitches = [
        ...taxSwitchs,
        ...taxSwitchsS,
    ];

    for (const switchElement of allTaxSwitches) {

        if (switchElement !== taxSwitch) {
            switchElement.checked = showTaxPrice;
        }

    }
}

// Desktop-layout switch - same behavior as the mobile variant.

for (const taxSwitch of taxSwitchs) {

    taxSwitch.addEventListener("change", () => {
        updateTaxDisplay(taxSwitch);
    });

}

// Mobile-layout switch - same behavior as above, duplicated for the
// separate mobile toggle element.

for (const taxSwitch of taxSwitchsS) {

    taxSwitch.addEventListener("change", () => {
        updateTaxDisplay(taxSwitch);
    });

}

// Initialize the display using the currently checked switch, if one exists.
// If neither switch is checked, the normal pre-tax price remains visible.
const initialTaxSwitch =
    [...taxSwitchs, ...taxSwitchsS].find(
        (taxSwitch) => taxSwitch.checked
    );

if (initialTaxSwitch) {
    updateTaxDisplay(initialTaxSwitch);
} else if (
    taxSwitchs.length > 0 ||
    taxSwitchsS.length > 0
) {
    const defaultTaxSwitch =
        taxSwitchs[0] || taxSwitchsS[0];

    updateTaxDisplay(defaultTaxSwitch);
}
