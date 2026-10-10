"use strict";

const Joi = require("joi");

const placeTypes = ["Room", "Entire home"];
const propertyTypes = ["House", "Flat", "Guest house", "Hotel"];

const amenityOptions = [
    "Wifi",
    "Kitchen",
    "Washing machine",
    "Dryer",
    "Air conditioning",
    "Heating",
];

const accessibilityOptions = [
    "step-free-entrance",
    "wide-entrance",
    "accessible-parking",
    "step-free-path",
];

const hostLanguageOptions = [
    "English",
    "French",
    "German",
    "Japanese",
];

const stringOrArray = (options, maxItems = 10) =>
    Joi.alternatives().try(
        Joi.string().valid(...options),
        Joi.array()
            .items(Joi.string().valid(...options))
            .max(maxItems)
    );

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().trim().min(3).max(100).required(),

        description: Joi.string()
            .trim()
            .min(10)
            .max(2000)
            .required(),

        country: Joi.string().trim().min(2).max(60).required(),

        location: Joi.string().trim().min(2).max(100).required(),

        price: Joi.number().min(0).max(10000000).required(),

        image: Joi.string().allow("", null),

        // Category is optional; an empty selection is valid.
        category: Joi.alternatives().try(
            Joi.string().trim().max(50).allow("", null),
            Joi.array()
                .items(Joi.string().trim().max(50))
                .max(10)
        ),

        // Property details
        placeType: Joi.string()
            .valid(...placeTypes)
            .empty(""),

        propertyType: Joi.string()
            .valid(...propertyTypes)
            .empty(""),

        bedrooms: Joi.number()
            .integer()
            .min(0)
            .max(50)
            .empty(""),

        beds: Joi.number()
            .integer()
            .min(0)
            .max(50)
            .empty(""),

        bathrooms: Joi.number()
            .min(0)
            .max(50)
            .empty(""),

        // Amenities
        amenities: stringOrArray(amenityOptions),

        // Booking options
        instantBook: Joi.boolean(),

        selfCheckIn: Joi.boolean(),

        allowsPets: Joi.boolean(),

        // Accessibility features
        accessibilityFeatures: stringOrArray(
            accessibilityOptions,
            4
        ),

        // Languages spoken by the host
        hostLanguages: stringOrArray(
            hostLanguageOptions,
            4
        ),
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .required(),

        comment: Joi.string()
            .trim()
            .min(2)
            .max(1000)
            .required(),
    }).required(),
});

module.exports.userSchema = Joi.object({
    fName: Joi.string().trim().min(2).max(50).required(),

    lName: Joi.string().trim().max(50).allow("", null),

    username: Joi.string().trim().min(3).max(30).required(),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .max(100)
        .required(),

    password: Joi.string().min(8).max(128),
});