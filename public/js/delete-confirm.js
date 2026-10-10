/*
 * public/js/delete-confirm.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Shows/hides a "are you sure?" confirmation overlay before a destructive
 *   delete action (listing/review) actually submits, instead of deleting
 *   immediately on the first click.
 *
 * USED ON:
 *   - views/listings/show.ejs, views/profiles/profile.ejs (anywhere with a
 *     delete button and a matching `.delete-fnx` confirmation box).
 * ---------------------------------------------------------------------------
 */

// User button click then display delete confirmation box----------

// Find the confirmation box related to a clicked delete button.
function findDeleteConfirmation(button) {
    let currentElement = button.parentElement;

    while (currentElement) {
        const confirmationBox =
            currentElement.querySelector(".delete-fnx");

        if (confirmationBox) {
            return confirmationBox;
        }

        currentElement = currentElement.parentElement;
    }

    // Fallback for pages with exactly one confirmation box.
    return document.querySelector(".delete-fnx");
}

// Show the confirmation box associated with a delete trigger.
function showDeleteConfirmation(button) {
    const confirmationBox =
        findDeleteConfirmation(button);

    if (confirmationBox) {
        confirmationBox.style.display = "flex";
        confirmationBox.parentElement?.classList.add("is-open");
    }
}

function hideDeleteConfirmation(confirmationBox) {
    if (!confirmationBox) {
        return;
    }

    confirmationBox.style.display = "none";
    confirmationBox.parentElement?.classList.remove("is-open");
}

// single delete btn----- (pages with exactly one delete button, e.g. show.ejs)
const deleteButton = document.querySelector(".del-btn");

if (deleteButton) {
    deleteButton.addEventListener("click", (event) => {
        event.preventDefault();

        showDeleteConfirmation(deleteButton);
    });
}

// many delete btn------ (pages with a list of delete buttons, e.g. profile.ejs)

// Handles both per-item delete buttons and bulk delete buttons.
const deleteButtons = document.querySelectorAll(
    ".list-delete, .delete-list"
);

for (const button of deleteButtons) {
    button.addEventListener("click", (event) => {
        event.preventDefault();

        // Walks the DOM relative to the clicked button to find that specific
        // row's confirmation box (each row has its own, since there are many).
        const confirmationBox =
            findDeleteConfirmation(button);

        if (confirmationBox) {
            confirmationBox.style.display = "flex";
        }
    });
}

// Cancel buttons for delete confirmation boxes.
const cancleButtons = document.querySelectorAll(
    ".cancle-confirm"
);

for (const cancleBtn of cancleButtons) {
    cancleBtn.addEventListener("click", () => {
        const confirmationBox =
            cancleBtn.closest(".delete-fnx");

        if (confirmationBox) {
            hideDeleteConfirmation(confirmationBox);
        }
    });
}

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    const openConfirmation = document.querySelector(
        ".fnx-fixed-dis.is-open .delete-fnx"
    );

    hideDeleteConfirmation(openConfirmation);
});
