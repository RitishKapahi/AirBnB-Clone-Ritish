"use strict";

const express = require("express");

const router = express.Router({
    mergeParams: true,
});

const wrapAsync = require("../utils/wrapAsync.js");

const {
    validateReview,
    isLoggedIn,
    isReviewAuthor,
    verifyCsrfToken,
} = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

router.post(
    "/",
    isLoggedIn,
    verifyCsrfToken,
    validateReview,
    wrapAsync(reviewController.createReview)
);

router.delete(
    "/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    verifyCsrfToken,
    wrapAsync(reviewController.destroyReview)
);

module.exports = router;
