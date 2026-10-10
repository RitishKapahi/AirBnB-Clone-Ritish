/*
 * public/js/update.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Tab-switching for the account-settings page: shows exactly one of the
 *   "Change Password" / "Edit Details" / "Change Image" panels at a time,
 *   based on which sidebar link was clicked.
 *
 * USED ON: views/users/update.ejs
 * ---------------------------------------------------------------------------
 */

"use strict";

const passwordBox =
    document.getElementById("password-box");

const detailBox =
    document.getElementById("detail-box");

const imageBox =
    document.getElementById("image-box");

const passwordFind =
    document.querySelector("#password-find");

const detailFind =
    document.querySelector("#detail-find");

const imageFind =
    document.querySelector("#image-find");

if (
    detailBox &&
    imageBox &&
    detailFind &&
    imageFind
) {

    const showBox = (selectedBox) => {

        const boxes = [
            passwordBox,
            detailBox,
            imageBox,
        ];

        boxes.forEach((box) => {

            if (box) {
                box.style.display =
                    box === selectedBox
                        ? "block"
                        : "none";
            }

        });

        [passwordFind, detailFind, imageFind].forEach((input) => {
            if (input) {
                input.setAttribute(
                    "aria-selected",
                    String(
                        (input === passwordFind && selectedBox === passwordBox) ||
                        (input === detailFind && selectedBox === detailBox) ||
                        (input === imageFind && selectedBox === imageBox)
                    )
                );
            }
        });

    };

    detailFind.addEventListener("change", () => {

        if (detailFind.checked) {
            showBox(detailBox);
        }

    });

    imageFind.addEventListener("change", () => {

        if (imageFind.checked) {
            showBox(imageBox);
        }

    });

    if (passwordFind) {

        passwordFind.addEventListener("change", () => {

            if (passwordFind.checked && passwordBox) {
                showBox(passwordBox);
            }

        });

    }

    // Set the initially selected tab and hide the other panels.
    if (
        passwordFind?.checked &&
        passwordBox
    ) {
        showBox(passwordBox);
    } else if (detailFind.checked) {
        showBox(detailBox);
    } else if (imageFind.checked) {
        showBox(imageBox);
    }

}
