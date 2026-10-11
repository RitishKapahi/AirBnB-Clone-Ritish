"use strict";

const express = require("express");

const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const upload = require("../utils/upload.js");
const { verifyCsrfToken } = require("../utils/csrf.js");
const { createRateLimiter } = require("../utils/rateLimit.js");
const {
    isAdmin,
    validateListing,
    handleUploadError,
    cleanupUploadedFile,
} = require("../middleware.js");
const adminController = require("../controllers/admin.js");
const listingController = require("../controllers/listings.js");

const adminMutationLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 30,
    message: "Too many administrative changes.",
});

router.use(isAdmin);

router.get("/listings", wrapAsync(adminController.index));

router.get(
    "/listings/:id/edit",
    wrapAsync(adminController.renderEditForm)
);

router.put(
    "/listings/:id",
    adminMutationLimiter,
    upload.single("listing[image]"),
    verifyCsrfToken,
    cleanupUploadedFile,
    handleUploadError,
    validateListing,
    wrapAsync(listingController.updateListing),
    cleanupUploadedFile
);

router.delete(
    "/listings/:id",
    adminMutationLimiter,
    wrapAsync(listingController.destroyListing)
);

module.exports = router;
