"use strict";

const express = require("express");

const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const upload = require("../utils/upload.js");
const {
    isAdmin,
    validateListing,
    handleUploadError,
    cleanupUploadedFile,
    verifyCsrfToken,
} = require("../middleware.js");
const adminController = require("../controllers/admin.js");
const listingController = require("../controllers/listings.js");

router.use(isAdmin);

router.get("/listings", wrapAsync(adminController.index));

router.get(
    "/listings/:id/edit",
    wrapAsync(adminController.renderEditForm)
);

router.put(
    "/listings/:id",
    upload.single("listing[image]"),
    cleanupUploadedFile,
    handleUploadError,
    verifyCsrfToken,
    validateListing,
    wrapAsync(listingController.updateListing),
    cleanupUploadedFile
);

router.delete(
    "/listings/:id",
    verifyCsrfToken,
    wrapAsync(listingController.destroyListing)
);

module.exports = router;
