"use strict";

const mongoose = require("mongoose");

const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

module.exports.createReview = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    if (!req.body.review) {
        req.flash("error", "Invalid review details.");
        return res.redirect(`/listings/${id}`);
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    const newReview = new Review(req.body.review);

    newReview.author = req.user._id;
    newReview.listing = listing._id;

    listing.reviews.push(newReview._id);

    await newReview.save();
    await listing.save();

    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyReview = async (req, res) => {
    const { id, reviewId } = req.params;

    if (
        !mongoose.isValidObjectId(id) ||
        !mongoose.isValidObjectId(reviewId)
    ) {
        req.flash("error", "This Review Page is not valid...");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }

    const review = await Review.findOne({
        _id: reviewId,
        listing: id,
    });

    if (!review) {
        req.flash("error", "Review you requested for does not exist!");
        return res.redirect(`/listings/${id}`);
    }

    listing.reviews.pull(review._id);

    await listing.save();
    await review.deleteOne();

    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
};