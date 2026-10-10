"use strict";

const express = require("express");

const passport = require("passport");

const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");

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

router
    .route("/signup")
    .get(userController.renderSignupForm)
    .post(
        varifyEmail,
        validateUser,
        wrapAsync(userController.signUser)
    );

router
    .route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        wrapAsync(userController.loginUser)
    );

router.get(
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
    isLoggedIn,
    isProfileOwner,
    wrapAsync(userController.updatePassword)
);

router.post(
    "/update-account/:id",
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
