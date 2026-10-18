"use strict";

const mongoose = require("mongoose");

const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const User = require("./models/user.js");
const ExpressError = require("./utils/ExpressError.js");
const { verifyCsrfToken } = require("./utils/csrf.js");

const { listingSchema, reviewSchema, userSchema } = require("./schema.js");

module.exports.verifyCsrfToken = verifyCsrfToken;

module.exports.validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);

    if (error) {
        const errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    }

    next();
};

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);

    if (error) {
        const errMsg = error.details.map((el) => el.message).join(", ");
        throw new ExpressError(400, errMsg);
    }

    next();
};

module.exports.validateUser = (req, res, next) => {
    const { error } = userSchema.validate(req.body);

    if (error) {
        const errMsg = error.details.map((el) => el.message).join(", ");

        req.flash("error", errMsg);

        if (!req.user) {
            return res.redirect("/signup");
        }

        return res.redirect(`/update-form/${req.user._id}`);
    }

    next();
};

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in.");
        return res.redirect("/login");
    }

    next();
};

/*
 * Admin access is deliberately configured outside the database. This keeps
 * the privilege explicit and avoids exposing an admin switch in a public
 * profile form. Set one or more of ADMIN_EMAIL, ADMIN_USERNAME, ADMIN_USER_ID
 * or the comma-separated ADMIN_EMAILS/ADMIN_USERNAMES values in .env.
 */
const configuredValues = (singleKey, listKey) => [
    process.env[singleKey],
    ...(process.env[listKey] || "").split(","),
]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);

const isAdminUser = (user) => {
    if (!user) return false;

    const configuredIds = [process.env.ADMIN_USER_ID]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

    const emails = configuredValues("ADMIN_EMAIL", "ADMIN_EMAILS");
    const usernames = configuredValues("ADMIN_USERNAME", "ADMIN_USERNAMES");

    return (
        configuredIds.includes(String(user._id)) ||
        emails.includes(String(user.email || "").toLowerCase()) ||
        usernames.includes(String(user.username || "").toLowerCase())
    );
};

module.exports.isAdminUser = isAdminUser;

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated?.() || !isAdminUser(req.user)) {
        req.flash("error", "Administrator access is required.");
        return res.redirect("/listings");
    }

    res.locals.isAdmin = true;
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }

    next();
};

module.exports.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            throw new ExpressError(400, "This Listing Page is not valid...");
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            throw new ExpressError(404, "Listing not found.");
        }

        if (
            !res.locals.currUser ||
            !listing.owner.equals(res.locals.currUser._id)
        ) {
            req.flash("error", "You are not the owner of this listing.");
            return res.redirect(`/listings/${id}`);
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports.isOwnerAll = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            throw new ExpressError(400, "This Listing Page is not valid...");
        }

        const listing = await Listing.findOne({ owner: id });

        if (!listing) {
            req.flash("error", "You don't have any listings...");
            return res.redirect("/profile");
        }

        if (
            !res.locals.currUser ||
            !listing.owner.equals(res.locals.currUser._id)
        ) {
            req.flash("error", "You are not the owner of this listing...");
            return res.redirect("/listings");
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;

        if (!mongoose.isValidObjectId(reviewId)) {
            throw new ExpressError(400, "This Review Page is not valid...");
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            throw new ExpressError(404, "Review not found.");
        }

        if (
            !res.locals.currUser ||
            !review.author.equals(res.locals.currUser._id)
        ) {
            req.flash("error", "You are not the author of this review.");
            return res.redirect(`/listings/${id}`);
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports.isReviewAuthorProfile = async (req, res, next) => {
    try {
        const { reviewId } = req.params;

        if (!mongoose.isValidObjectId(reviewId)) {
            throw new ExpressError(400, "This Review Page is not valid...");
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            throw new ExpressError(404, "Review not found.");
        }

        if (
            !res.locals.currUser ||
            !review.author.equals(res.locals.currUser._id)
        ) {
            req.flash("error", "You are not the author of this review.");
            return res.redirect("/listings");
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports.isReviewAll = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            throw new ExpressError(400, "This Review Page is not valid...");
        }

        const review = await Review.findOne({ author: id });

        if (!review) {
            req.flash("error", "You don't have any reviews...");
            return res.redirect("/profile");
        }

        if (
            !res.locals.currUser ||
            !review.author.equals(res.locals.currUser._id)
        ) {
            req.flash("error", "You are not the author of this review.");
            return res.redirect("/listings");
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports.isProfileOwner = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            throw new ExpressError(400, "This Profile Page is not valid...");
        }

        const user = await User.findById(id);

        if (!user) {
            throw new ExpressError(404, "Profile not found.");
        }

        if (
            !res.locals.currUser ||
            !user._id.equals(res.locals.currUser._id)
        ) {
            req.flash("error", "You are not the profile owner.");
            return res.redirect(`/listings/${id}`);
        }

        next();
    } catch (err) {
        next(err);
    }
};

module.exports.varifyEmail = async (req, res, next) => {
    try {
        const existingUser = await User.findOne({
            email: req.body.email,
        });

        if (!existingUser) {
            return next();
        }

        req.flash(
            "error",
            "Account with that email address already exists."
        );

        if (!req.user) {
            return res.redirect("/signup");
        }

        return res.redirect(`/update-form/${req.user._id}`);
    } catch (err) {
        next(err);
    }
};

module.exports.varifyUserEmail = async (req, res, next) => {
    try {
        const existingUser = await User.findOne({
            email: req.body.email,
        });

        if (!existingUser) {
            return next();
        }

        if (req.user && existingUser._id.equals(req.user._id)) {
            return next();
        }

        req.flash(
            "error",
            "Account with that email address already exists."
        );

        if (!req.user) {
            return res.redirect("/signup");
        }

        return res.redirect(`/update-form/${req.user._id}`);
    } catch (err) {
        next(err);
    }
};

/*
 * Upload error handler.
 *
 * Multer runs before the controller, so upload errors need to be handled
 * separately. This converts common upload failures into user-friendly
 * flash messages instead of sending the user to the generic error page.
 */
module.exports.handleUploadError = (err, req, res, next) => {
    if (!err) {
        return next();
    }

    let message;

    if (err.code === "LIMIT_FILE_SIZE") {
        message = "File size exceeds the limit (100KB).";
    } else if (err.name === "ExpressError") {
        message = err.message;
    } else {
        return next(err);
    }

    req.flash("error", message);

    const referer = req.get("referer");

    // Only redirect to a same-origin Referer to avoid open redirects.
    if (referer) {
        try {
            const refererUrl = new URL(
                referer,
                `${req.protocol}://${req.get("host")}`
            );

            if (
                refererUrl.origin ===
                `${req.protocol}://${req.get("host")}`
            ) {
                return res.redirect(
                    refererUrl.pathname + refererUrl.search
                );
            }
        } catch (error) {
            // Invalid Referer -> use the fallback below.
        }
    }

    if (req.originalUrl.startsWith("/listings/")) {
        if (req.params.id) {
            return res.redirect(
                `/listings/${req.params.id}/edit`
            );
        }

        return res.redirect("/listings/new");
    }

    if (req.originalUrl.startsWith("/change-image/")) {
        return res.redirect(
            `/change-image/${req.params.id}`
        );
    }

    if (req.originalUrl.startsWith("/update-image/")) {
        return res.redirect(
            `/update-form/${req.params.id}`
        );
    }

    return res.redirect("/listings");
};

/*
 * Cleans up a newly uploaded Cloudinary image when a later middleware or
 * controller fails. This prevents orphaned Cloudinary files when validation,
 * database operations, or other downstream processing fails after upload.
 */
module.exports.cleanupUploadedFile = async (err, req, res, next) => {
    if (!err || !req.file?.filename) {
        return next(err);
    }

    try {
        const { cloudinary } = require("./cloudConfig.js");

        await cloudinary.uploader.destroy(
            req.file.filename
        );
    } catch (cleanupError) {
        console.error(
            "Failed to clean up uploaded Cloudinary image:",
            cleanupError.message
        );
    }

    next(err);
};
