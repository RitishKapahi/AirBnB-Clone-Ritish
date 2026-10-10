"use strict";

const mongoose = require("mongoose");

const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports.index = async (req, res) => {
    const search = typeof req.query.q === "string"
        ? req.query.q.trim().slice(0, 100)
        : "";

    const filter = search
        ? {
            $or: [
                { title: new RegExp(escapeRegex(search), "i") },
                { location: new RegExp(escapeRegex(search), "i") },
                { country: new RegExp(escapeRegex(search), "i") },
            ],
        }
        : {};

    const listings = await Listing.find(filter)
        .populate("owner", "fName lName username email")
        .sort({ createdAt: -1, _id: -1 })
        .lean();

    res.render("admin-listings.ejs", { listings, search });
};

module.exports.renderEditForm = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        throw new ExpressError(400, "Listing not found.");
    }

    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found.");
    }

    res.render("listings/edit.ejs", {
        listing,
        adminContext: true,
    });
};
