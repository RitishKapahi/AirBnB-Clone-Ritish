"use strict";

const express = require("express");

const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const upload = require("../utils/upload.js");
const { verifyCsrfToken } = require("../utils/csrf.js");

const {
    validateListing,
    isLoggedIn,
    isOwner,
    handleUploadError,
    cleanupUploadedFile,
} = require("../middleware.js");

const listingController = require("../controllers/listings.js");

router.get(
    "/filter/:id",
    wrapAsync(listingController.filter)
);

router.get(
    "/filterbtn",
    listingController.filterbtn
);

router.get(
    "/search",
    wrapAsync(listingController.search)
);

router.post(
    "/:id/favorite",
    isLoggedIn,
    wrapAsync(listingController.addFavorite)
);

router.delete(
    "/:id/favorite",
    isLoggedIn,
    wrapAsync(listingController.removeFavorite)
);

router
    .route("/")
    .get(
        wrapAsync(listingController.index)
    )
    .post(
        isLoggedIn,
        upload.single("listing[image]"),
        verifyCsrfToken,
        cleanupUploadedFile,
        handleUploadError,
        validateListing,
        wrapAsync(listingController.createListing),
        cleanupUploadedFile
    );

router.get(
    "/new",
    isLoggedIn,
    listingController.renderNewForm
);

router
    .route("/:id")
    .get(
        wrapAsync(listingController.showListing)
    )
    .put(
        isLoggedIn,
        isOwner,
        upload.single("listing[image]"),
        verifyCsrfToken,
        cleanupUploadedFile,
        handleUploadError,
        validateListing,
        wrapAsync(listingController.updateListing),
        cleanupUploadedFile
    )
    .delete(
        isLoggedIn,
        isOwner,
        wrapAsync(listingController.destroyListing)
    );

router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;
