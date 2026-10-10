"use strict";

const mongoose = require("mongoose");

const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const { cloudinary } = require("../cloudConfig.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup");
};

module.exports.signUser = async (req, res, next) => {
    try {
        const {
            fName,
            lName,
            username,
            email,
            password,
        } = req.body;

        const newUser = new User({
            fName,
            lName,
            email,
            username,
        });

        const registeredUser = await User.register(
            newUser,
            password
        );

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }

            req.flash(
                "success",
                "User was registered and logged in!"
            );

            res.redirect("/listings");
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login");
};

module.exports.loginUser = (req, res) => {
    req.flash(
        "success",
        "Welcome back to AirBnB Clone By Ritish Kapahi!"
    );

    const redirectUrl =
        res.locals.redirectUrl || "/listings";

    res.redirect(redirectUrl);
};

module.exports.logoutUser = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};

module.exports.updateFormRender = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Profile not found.");
        return res.redirect("/profile");
    }

    const user = await User.findById(id);

    if (!user) {
        req.flash("error", "Profile not found.");
        return res.redirect("/profile");
    }

    res.render("users/update.ejs", { user });
};

module.exports.updateAccount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            req.flash("error", "Profile not found.");
            return res.redirect("/profile");
        }

        const user = await User.findById(id);

        if (!user) {
            req.flash("error", "Profile not found.");
            return res.redirect("/profile");
        }

        const {
            fName,
            lName,
            username,
            email,
        } = req.body;

        user.fName = fName;
        user.lName = lName;
        user.email = email;

        if (username !== user.username) {
            await user.setUsername(username);
        }

        await user.save();

        req.flash(
            "success",
            "Your account updated successfully."
        );

        res.redirect("/profile");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect(`/update-form/${req.user._id}`);
    }
};

module.exports.updatePassword = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            req.flash("error", "Profile not found.");
            return res.redirect("/profile");
        }

        const user = await User.findById(id);

        if (!user) {
            req.flash("error", "Profile not found.");
            return res.redirect("/profile");
        }

        await user.changePassword(
            req.body.oldPassword,
            req.body.newPassword
        );

        await user.save();

        req.flash(
            "success",
            "Your account password has been successfully updated."
        );

        res.redirect("/profile");
    } catch (err) {
        req.flash(
            "error",
            "Old password doesn't match or the new password is invalid."
        );

        res.redirect(`/update-form/${req.user._id}`);
    }
};

module.exports.updateImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            req.flash("error", "Profile not found.");
            return res.redirect("/profile");
        }

        if (!req.file) {
            req.flash("error", "Please select an image.");
            return res.redirect(`/update-form/${id}`);
        }

        const user = await User.findById(id);

        if (!user) {
            req.flash("error", "Profile not found.");
            return res.redirect("/profile");
        }

        const oldFilename = user.image?.filename;

        user.image = {
            url: req.file.path,
            filename: req.file.filename,
        };

        await user.save();

        if (
            oldFilename &&
            oldFilename !== req.file.filename
        ) {
            try {
                await cloudinary.uploader.destroy(
                    oldFilename
                );
            } catch (err) {
                console.error(
                    "Failed to delete old profile image:",
                    err.message
                );
            }
        }

        req.flash(
            "success",
            "Your account image has been successfully updated."
        );

        res.redirect("/profile");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect(`/update-form/${req.user._id}`);
    }
};

module.exports.renderImageChangeForm = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Profile not found.");
        return res.redirect("/profile");
    }

    const user = await User.findById(id);

    if (!user) {
        req.flash("error", "Profile not found.");
        return res.redirect("/profile");
    }

    res.render("users/changeImage.ejs", { user });
};

module.exports.deleteAccount = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            req.flash("error", "Profile not found.");
            return res.redirect("/profile");
        }

        const user = await User.findById(id);

        if (!user) {
            req.flash("error", "Profile not found.");
            return res.redirect("/profile");
        }

        const listings = await Listing.find({
            owner: id,
        }).select("_id reviews image.filename");

        const listingImageFilenames = listings
            .map((listing) => listing.image?.filename)
            .filter(Boolean);

        const listingReviewIds = listings.flatMap(
            (listing) => listing.reviews
        );

        const listingIds = listings.map(
            (listing) => listing._id
        );

        await User.updateMany(
            { favorites: { $in: listingIds } },
            { $pull: { favorites: { $in: listingIds } } }
        );

        await Listing.deleteMany({
            owner: id,
        });

        await Review.deleteMany({
            $or: [
                { author: id },
                {
                    _id: {
                        $in: listingReviewIds,
                    },
                },
            ],
        });

        for (const filename of listingImageFilenames) {
            try {
                await cloudinary.uploader.destroy(filename);
            } catch (err) {
                console.error(
                    `Failed to delete listing image "${filename}":`,
                    err.message
                );
            }
        }

        if (user.image?.filename) {
            try {
                await cloudinary.uploader.destroy(
                    user.image.filename
                );
            } catch (err) {
                console.error(
                    "Failed to delete profile image:",
                    err.message
                );
            }
        }

        await User.findByIdAndDelete(id);

        req.logout((err) => {
            if (err) {
                return next(err);
            }

            req.flash(
                "success",
                "Your account has been successfully deleted."
            );

            res.redirect("/listings");
        });
    } catch (err) {
        console.error("Account deletion failed:", err);

        req.flash(
            "error",
            "Unable to delete your account right now."
        );

        res.redirect("/profile");
    }
};
