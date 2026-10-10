"use strict";

const express = require("express");

const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");

const {
    isLoggedIn,
    isOwner,
    isOwnerAll,
    isReviewAuthorProfile,
    isReviewAll,
} = require("../middleware.js");

const profileController = require("../controllers/profiles.js");

router.get(
    "/",
    isLoggedIn,
    wrapAsync(profileController.profile)
);

router.delete(
    "/all-listings-delete/:id",
    isLoggedIn,
    isOwnerAll,
    wrapAsync(profileController.allListingDestroy)
);

router.delete(
    "/listing/:id",
    isLoggedIn,
    isOwner,
    wrapAsync(profileController.profileDestroyListing)
);

router.delete(
    "/all-reviews-delete/:id",
    isLoggedIn,
    isReviewAll,
    wrapAsync(profileController.allReviewDestroy)
);

router.delete(
    "/review/:id/:reviewId",
    isLoggedIn,
    isReviewAuthorProfile,
    wrapAsync(profileController.profileDestroyReview)
);

module.exports = router;