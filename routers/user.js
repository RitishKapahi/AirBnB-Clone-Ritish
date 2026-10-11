"use strict";

const express = require("express");

const passport = require("passport");

const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const { verifyCsrfToken } = require("../utils/csrf.js");
const { createRateLimiter } = require("../utils/rateLimit.js");

const upload = require("../utils/upload.js");

const {
    saveRedirectUrl,
    isLoggedIn,
    isProfileOwner,
    validateUser,
    varifyEmail,
    varifyUserEmail,
    handleUploadError,
    cleanupUploadedFile,
} = require("../middleware.js");

const userController = require("../controllers/users.js");

const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: "Too many login attempts.",
});

const signupLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 6,
    message: "Too many sign-up attempts.",
});

const passwordChangeLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 6,
    message: "Too many password-change attempts.",
});

const accountUpdateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    message: "Too many account-update attempts.",
});

router
    .route("/signup")
    .get(userController.renderSignupForm)
    .post(
        signupLimiter,
        varifyEmail,
        validateUser,
        wrapAsync(userController.signUser)
    );

router
    .route("/login")
    .get(userController.renderLoginForm)
    .post(
        loginLimiter,
        saveRedirectUrl,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        wrapAsync(userController.loginUser)
    );

router.post(
    "/logout",
    isLoggedIn,
    userController.logoutUser
);

router.get("/", (req, res) => {
    res.redirect("/listings");
});

router.get(
    "/update-form/:id",
    isLoggedIn,
    isProfileOwner,
    wrapAsync(userController.updateFormRender)
);

router.post(
    "/update-password/:id",
    passwordChangeLimiter,
    isLoggedIn,
    isProfileOwner,
    wrapAsync(userController.updatePassword)
);

router.post(
    "/update-account/:id",
    accountUpdateLimiter,
    isLoggedIn,
    isProfileOwner,
    varifyUserEmail,
    validateUser,
    wrapAsync(userController.updateAccount)
);

router.post(
    "/update-image/:id",
    isLoggedIn,
    isProfileOwner,
    upload.single("image"),
    cleanupUploadedFile,
    handleUploadError,
    wrapAsync(userController.updateImage),
    cleanupUploadedFile
);

router
    .route("/change-image/:id")
    .get(
        isLoggedIn,
        isProfileOwner,
        userController.renderImageChangeForm
    )
    .post(
        isLoggedIn,
        isProfileOwner,
        upload.single("image"),
        verifyCsrfToken,
        cleanupUploadedFile,
        handleUploadError,
        wrapAsync(userController.updateImage),
        cleanupUploadedFile
    );

router.delete(
    "/delete/:id",
    isLoggedIn,
    isProfileOwner,
    wrapAsync(userController.deleteAccount)
);

module.exports = router;
