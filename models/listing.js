"use strict";

const mongoose = require("mongoose");
const Review = require("./review.js");
const { Schema } = mongoose;

const listingSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 100,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        image: {
            url: { type: String, required: true },
            filename: { type: String, required: true },
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },

        // Property details used by the listing filters.
        placeType: {
            type: String,
            enum: ["Room", "Entire home"],
        },
        propertyType: {
            type: String,
            enum: ["House", "Flat", "Guest house", "Hotel"],
        },
        bedrooms: {
            type: Number,
            min: 0,
            max: 50,
            validate: {
                validator: Number.isInteger,
                message: "Bedrooms must be a whole number.",
            },
        },
        beds: {
            type: Number,
            min: 0,
            max: 50,
            validate: {
                validator: Number.isInteger,
                message: "Beds must be a whole number.",
            },
        },
        bathrooms: {
            type: Number,
            min: 0,
            max: 50,
        },

        // Amenities supported by the filter panel.
        amenities: {
            type: [{
                type: String,
                enum: [
                    "Wifi",
                    "Kitchen",
                    "Washing machine",
                    "Dryer",
                    "Air conditioning",
                    "Heating",
                ],
            }],
            default: [],
        },

        // Booking options.
        instantBook: {
            type: Boolean,
        },
        selfCheckIn: {
            type: Boolean,
        },
        allowsPets: {
            type: Boolean,
        },

        // Accessibility features supported by the filter panel.
        accessibilityFeatures: {
            type: [{
                type: String,
                enum: [
                    "step-free-entrance",
                    "wide-entrance",
                    "accessible-parking",
                    "step-free-path",
                ],
            }],
            default: [],
        },

        // Languages spoken by the host.
        hostLanguages: {
            type: [{
                type: String,
                enum: [
                    "English",
                    "French",
                    "German",
                    "Japanese",
                ],
            }],
            default: [],
        },

        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        geometry: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator: (coordinates) => {
                        if (coordinates.length !== 2) return false;

                        const [longitude, latitude] = coordinates;

                        return (
                            longitude >= -180 &&
                            longitude <= 180 &&
                            latitude >= -90 &&
                            latitude <= 90
                        );
                    },
                    message: "Invalid GeoJSON coordinates.",
                },
            },
        },
        category: {
            type: [String],
            default: [],
        },
        // Private key used to safely identify generated demo listings.
        demoSeedKey: {
            type: String,
            trim: true,
            unique: true,
            sparse: true,
            select: false,
        },
    },
    { timestamps: true }
);

listingSchema.post("findOneAndDelete", async (listing) => {
    if (!listing) return;

    await Review.deleteMany({
        _id: { $in: listing.reviews },
    });
});

listingSchema.post(
    "deleteOne",
    { document: true, query: false },
    async function () {
        if (!this.reviews?.length) return;

        await Review.deleteMany({
            _id: { $in: this.reviews },
        });
    }
);

listingSchema.pre(
    "deleteMany",
    { document: false, query: true },
    async function () {
        const listings = await this.model
            .find(this.getFilter())
            .select("reviews");

        const reviewIds = listings.flatMap(
            (listing) => listing.reviews
        );

        if (!reviewIds.length) return;

        await Review.deleteMany({
            _id: { $in: reviewIds },
        });
    }
);

const Listing = mongoose.model("Listing", listingSchema);

module.exports = Listing;
