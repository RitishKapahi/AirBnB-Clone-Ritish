"use strict";

const mongoose = require("mongoose");

const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");
const { cloudinary } = require("../cloudConfig.js");

module.exports.profile = async (req, res) => {
    const userId = req.user._id;

    const [allListing, allReview] = await Promise.all([
        Listing.find({ owner: userId })
            .populate("owner")
            .sort({ _id: -1 }),

        Review.find({ author: userId })
            .populate("listing")
            .sort({ _id: -1 }),
    ]);

    res.render("profiles/profile.ejs", {
        allListing,
        allReview,
    });
};

module.exports.allListingDestroy = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Invalid profile.");
        return res.redirect("/profile");
    }

    const listings = await Listing.find({
        owner: id,
    }).select("_id image.filename");

    if (listings.length === 0) {
        req.flash("success", "Listings 0 Deleted!");
        return res.redirect("/profile");
    }

    const imageFilenames = listings
        .map((listing) => listing.image?.filename)
        .filter(Boolean);

    const listingIds = listings.map((listing) => listing._id);

    await User.updateMany(
        { favorites: { $in: listingIds } },
        { $pull: { favorites: { $in: listingIds } } }
    );

    const result = await Listing.deleteMany({
        owner: id,
    });

    for (const filename of imageFilenames) {
        try {
            await cloudinary.uploader.destroy(filename);
        } catch (err) {
            console.error(
                `Failed to delete listing image "${filename}":`,
                err.message
            );
        }
    }

    req.flash(
        "success",
        `Listings ${result.deletedCount} Deleted!`
    );

    res.redirect("/profile");
};

module.exports.profileDestroyListing = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Listing not found.");
        return res.redirect("/profile");
    }

    const listing = await Listing.findOne({
        _id: id,
        owner: req.user._id,
    });

    if (!listing) {
        req.flash(
            "error",
            "You are not the owner of this listing."
        );

        return res.redirect("/profile");
    }

    await User.updateMany(
        { favorites: id },
        { $pull: { favorites: id } }
    );

    await listing.deleteOne();

    if (listing.image?.filename) {
        try {
            await cloudinary.uploader.destroy(
                listing.image.filename
            );
        } catch (err) {
            console.error(
                "Failed to delete listing image:",
                err.message
            );
        }
    }

    req.flash("success", "Listing Deleted!");
    res.redirect("/profile");
};

module.exports.allReviewDestroy = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Invalid profile.");
        return res.redirect("/profile");
    }

    const reviews = await Review.find({
        author: id,
    }).select("_id listing");

    if (reviews.length === 0) {
        req.flash("success", "Reviews 0 Deleted!");
        return res.redirect("/profile");
    }

    const reviewIds = reviews.map(
        (review) => review._id
    );

    const listingIds = reviews
        .map((review) => review.listing)
        .filter(Boolean);

    await Listing.updateMany(
        {
            _id: { $in: listingIds },
        },
        {
            $pull: {
                reviews: {
                    $in: reviewIds,
                },
            },
        }
    );

    const result = await Review.deleteMany({
        _id: {
            $in: reviewIds,
        },
    });

    req.flash(
        "success",
        `Reviews ${result.deletedCount} Deleted!`
    );

    res.redirect("/profile");
};

module.exports.profileDestroyReview = async (req, res) => {
    const { id, reviewId } = req.params;

    if (
        !mongoose.isValidObjectId(id) ||
        !mongoose.isValidObjectId(reviewId)
    ) {
        req.flash("error", "Review not found.");
        return res.redirect("/profile");
    }

    const review = await Review.findOne({
        _id: reviewId,
        author: req.user._id,
        listing: id,
    });

    if (!review) {
        req.flash(
            "error",
            "You are not the author of this review."
        );

        return res.redirect("/profile");
    }

    await Listing.updateOne(
        {
            _id: id,
        },
        {
            $pull: {
                reviews: review._id,
            },
        }
    );

    await review.deleteOne();

    req.flash("success", "Review Deleted!");
    res.redirect("/profile");
};
