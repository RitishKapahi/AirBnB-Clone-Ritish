"use strict";

const mongoose = require("mongoose");

const { Schema } = mongoose;

const reviewSchema = new Schema(
    {
        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 1000,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number between 1 and 5.",
            },
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },

        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;