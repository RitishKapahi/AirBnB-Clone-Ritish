"use strict";

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");
const ExpressError = require("../utils/ExpressError.js");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const { cloudinary } = require("../cloudConfig.js");

const mapToken = process.env.MAP_TOKEN;

const geocodingClient = mapToken
    ? mbxGeocoding({ accessToken: mapToken })
    : null;

const placeTypeOptions = ["Room", "Entire home"];

const propertyTypeOptions = [
    "House",
    "Flat",
    "Guest house",
    "Hotel",
];

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

const normalizeArray = (value) => {
    if (value === undefined || value === null || value === "") {
        return [];
    }

    const values = Array.isArray(value) ? value : [value];

    return values
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
};

const isEnabled = (value) => {
    if (Array.isArray(value)) {
        return value.some(isEnabled);
    }

    return value === true ||
        ["true", "1", "on", "yes"].includes(
            String(value ?? "").toLowerCase()
        );
};

const readNumber = (value) => {
    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : null;
};

const normalizeListingData = (input = {}) => {
    const data = { ...input };

    for (const field of [
        "amenities",
        "accessibilityFeatures",
        "hostLanguages",
    ]) {
        data[field] = normalizeArray(data[field]);
    }

    data.amenities = data.amenities.filter((value) =>
        amenityOptions.includes(value)
    );

    data.accessibilityFeatures = data.accessibilityFeatures.filter(
        (value) => accessibilityOptions.includes(value)
    );

    data.hostLanguages = data.hostLanguages.filter((value) =>
        hostLanguageOptions.includes(value)
    );

    for (const field of [
        "instantBook",
        "selfCheckIn",
        "allowsPets",
    ]) {
        data[field] = isEnabled(data[field]);
    }

    for (const field of ["placeType", "propertyType"]) {
        if (typeof data[field] !== "string") {
            data[field] = undefined;
        } else {
            data[field] = data[field].trim() || undefined;
        }
    }

    if (
        data.placeType &&
        !placeTypeOptions.includes(data.placeType)
    ) {
        data.placeType = undefined;
    }

    if (
        data.propertyType &&
        !propertyTypeOptions.includes(data.propertyType)
    ) {
        data.propertyType = undefined;
    }

    for (const field of ["bedrooms", "beds", "bathrooms"]) {
        if (
            data[field] === undefined ||
            data[field] === null ||
            String(data[field]).trim() === ""
        ) {
            data[field] = undefined;
        } else {
            data[field] = Number(data[field]);
        }
    }

    if (Object.prototype.hasOwnProperty.call(data, "category")) {
        data.category = normalizeArray(data.category)
            .filter((category) => category.length <= 50)
            .slice(0, 10);
    } else {
        data.category = [];
    }

    delete data.image;
    delete data.owner;
    delete data.geometry;
    delete data.reviews;

    return data;
};

const getSearchTerm = (params = {}) => {
    const candidates = [
        params.search,
        params.q,
        params.query,
        params.term,
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim()) {
            return candidate.trim().slice(0, 100);
        }

        if (candidate && typeof candidate === "object") {
            for (const value of Object.values(candidate)) {
                if (typeof value === "string" && value.trim()) {
                    return value.trim().slice(0, 100);
                }
            }
        }
    }

    return "";
};

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const categoryAliases = {
    castles: ["Castles", "Casties"],
};

const buildCategoryFilter = (value) => {
    const category = String(value).trim();
    const aliases = categoryAliases[category.toLowerCase()] || [
        category,
    ];

    return new RegExp(
        `^(?:${aliases.map(escapeRegex).join("|")})$`,
        "i"
    );
};

const buildListingFilter = (params = {}) => {
    const filter = {};

    const selectedPlaceTypes = normalizeArray(params.placeType)
        .filter((value) => placeTypeOptions.includes(value));

    const selectedPropertyTypes = normalizeArray(params.propertyType)
        .filter((value) => propertyTypeOptions.includes(value));

    if (selectedPlaceTypes.length === 1) {
        filter.placeType = selectedPlaceTypes[0];
    } else if (selectedPlaceTypes.length > 1) {
        filter.placeType = { $in: selectedPlaceTypes };
    }

    if (selectedPropertyTypes.length === 1) {
        filter.propertyType = selectedPropertyTypes[0];
    } else if (selectedPropertyTypes.length > 1) {
        filter.propertyType = { $in: selectedPropertyTypes };
    }

    const minimumPrice = readNumber(
        params.minimumPrice ?? params.minPrice
    );

    const maximumPrice = readNumber(
        params.maximumPrice ?? params.maxPrice
    );

    const priceFilter = {};

    if (minimumPrice !== null && minimumPrice >= 0) {
        priceFilter.$gte = minimumPrice;
    }

    if (maximumPrice !== null && maximumPrice >= 0) {
        priceFilter.$lte = maximumPrice;
    }

    if (Object.keys(priceFilter).length > 0) {
        filter.price = priceFilter;
    }

    const bedrooms = readNumber(params.bedrooms ?? params.rooms);
    const beds = readNumber(params.beds);
    const bathrooms = readNumber(params.bathrooms);

    if (bedrooms !== null && bedrooms > 0) {
        filter.bedrooms = { $gte: bedrooms };
    }

    if (beds !== null && beds > 0) {
        filter.beds = { $gte: beds };
    }

    if (bathrooms !== null && bathrooms > 0) {
        filter.bathrooms = { $gte: bathrooms };
    }

    const selectedAmenities = normalizeArray(params.amenities);

    const amenityAliases = {
        wifi: "Wifi",
        kitchen: "Kitchen",
        "washing-machine": "Washing machine",
        dryer: "Dryer",
        "air-conditioning": "Air conditioning",
        heating: "Heating",
    };

    for (const [key, value] of Object.entries(amenityAliases)) {
        if (isEnabled(params[key])) {
            selectedAmenities.push(value);
        }
    }

    const validAmenities = [
        ...new Set(
            selectedAmenities.filter((value) =>
                amenityOptions.includes(value)
            )
        ),
    ];

    if (validAmenities.length > 0) {
        filter.amenities = { $all: validAmenities };
    }

    const selectedAccessibility = normalizeArray(
        params.accessibilityFeatures
    );

    for (const value of accessibilityOptions) {
        if (isEnabled(params[value])) {
            selectedAccessibility.push(value);
        }
    }

    const validAccessibility = [
        ...new Set(
            selectedAccessibility.filter((value) =>
                accessibilityOptions.includes(value)
            )
        ),
    ];

    if (validAccessibility.length > 0) {
        filter.accessibilityFeatures = {
            $all: validAccessibility,
        };
    }

    const selectedLanguages = normalizeArray(params.hostLanguages);

    const languageAliases = {
        english: "English",
        french: "French",
        german: "German",
        japanese: "Japanese",
    };

    for (const [key, value] of Object.entries(languageAliases)) {
        if (isEnabled(params[key])) {
            selectedLanguages.push(value);
        }
    }

    const validLanguages = [
        ...new Set(
            selectedLanguages.filter((value) =>
                hostLanguageOptions.includes(value)
            )
        ),
    ];

    if (validLanguages.length > 0) {
        filter.hostLanguages = { $all: validLanguages };
    }

    if (
        isEnabled(params.instantBook) ||
        isEnabled(params["instant-book"])
    ) {
        filter.instantBook = true;
    }

    if (
        isEnabled(params.selfCheckIn) ||
        isEnabled(params["self-check-in"])
    ) {
        filter.selfCheckIn = true;
    }

    if (
        isEnabled(params.allowsPets) ||
        isEnabled(params["allows-pets"])
    ) {
        filter.allowsPets = true;
    }

    if (params.category) {
        const categories = normalizeArray(params.category);
        const categoryFilters = categories.map(buildCategoryFilter);

        if (categories.length === 1) {
            filter.category = categoryFilters[0];
        } else if (categories.length > 1) {
            filter.category = { $in: categoryFilters };
        }
    }

    const searchTerm = getSearchTerm(params);

    if (searchTerm) {
        const searchRegex = new RegExp(escapeRegex(searchTerm), "i");

        filter.$or = [
            { title: searchRegex },
            { description: searchRegex },
            { location: searchRegex },
            { country: searchRegex },
            { category: searchRegex },
        ];
    }

    return filter;
};

const geocodeListing = async (location, country) => {
    if (!geocodingClient) {
        throw new ExpressError(
            500,
            "The Mapbox API token is not configured."
        );
    }

    const response = await geocodingClient
        .forwardGeocode({
            query: `${location}, ${country}`,
            limit: 1,
        })
        .send();

    const feature = response.body.features?.[0];

    if (!feature || !feature.geometry) {
        throw new ExpressError(
            422,
            "We could not find that location. Please check the location and country."
        );
    }

    return feature.geometry;
};

const removeCloudinaryImage = async (filename) => {
    if (!filename || !cloudinary?.uploader) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(filename);
    } catch (error) {
        console.error("Cloudinary image cleanup failed:", error.message);
    }
};

const renderListings = async (req, res, extraFilter = {}) => {
    const filters = {
        ...buildListingFilter(req.query),
        ...extraFilter,
    };

    const allListing = await Listing.find(filters)
        .sort({ _id: -1 })
        .populate("reviews", "rating")
        .lean();

    res.render("listings/index.ejs", {
        allListing,
        filters: req.query,
        listingCount: allListing.length,
        favoriteIds: Array.isArray(req.user?.favorites)
            ? req.user.favorites.map((id) => String(id))
            : [],
    });
};

module.exports.index = async (req, res) => {
    await renderListings(req, res);
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", {
        listing: {},
    });
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate("owner")
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        });

    if (!listing) {
        throw new ExpressError(404, "Listing not found.");
    }

    res.render("listings/show.ejs", {
        listing,
        mapToken,
        currUser: req.user,
        currentUser: req.user,
    });
};

module.exports.createListing = async (req, res) => {
    if (!req.file) {
        throw new ExpressError(400, "Please upload a listing image.");
    }

    const listingData = normalizeListingData(req.body.listing);

    const newListing = new Listing(listingData);

    newListing.owner = req.user._id;
    newListing.image = {
        url: req.file.path,
        filename: req.file.filename,
    };

    newListing.geometry = await geocodeListing(
        newListing.location,
        newListing.country
    );

    await newListing.save();

    req.flash("success", "New listing created successfully!");

    res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found.");
    }

    res.render("listings/edit.ejs", {
        listing,
    });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found.");
    }

    const listingData = normalizeListingData(req.body.listing);

    const geometry = await geocodeListing(
        listingData.location,
        listingData.country
    );

    const previousImageFilename = listing.image?.filename;

    listing.set(listingData);
    listing.geometry = geometry;

    if (req.file) {
        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    await listing.save();

    if (
        req.file &&
        previousImageFilename &&
        previousImageFilename !== req.file.filename
    ) {
        await removeCloudinaryImage(previousImageFilename);
    }

    req.flash("success", "Listing updated successfully!");

    res.redirect(
        res.locals.isAdmin
            ? "/admin/listings"
            : `/listings/${listing._id}`
    );
};

module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found.");
    }

    const imageFilename = listing.image?.filename;

    await User.updateMany(
        { favorites: id },
        { $pull: { favorites: id } }
    );

    await Listing.findByIdAndDelete(id);

    if (imageFilename) {
        await removeCloudinaryImage(imageFilename);
    }

    req.flash("success", "Listing deleted successfully!");

    res.redirect(
        res.locals.isAdmin
            ? "/admin/listings"
            : "/listings"
    );
};

module.exports.filter = async (req, res) => {
    await renderListings(req, res, {
        category: buildCategoryFilter(req.params.id),
    });
};

module.exports.search = async (req, res) => {
    await renderListings(req, res);
};

const sendFavoriteResponse = (req, res, liked) => {
    if (req.accepts("json")) {
        return res.json({ liked });
    }

    req.flash(
        "success",
        liked ? "Listing added to favourites." : "Listing removed from favourites."
    );

    return res.redirect(req.get("referer") || "/listings");
};

module.exports.addFavorite = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Listing not found.");
    }

    const listingExists = await Listing.exists({ _id: id });

    if (!listingExists) {
        throw new ExpressError(404, "Listing not found.");
    }

    await User.updateOne(
        { _id: req.user._id },
        { $addToSet: { favorites: id } }
    );

    return sendFavoriteResponse(req, res, true);
};

module.exports.removeFavorite = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        throw new ExpressError(400, "Listing not found.");
    }

    await User.updateOne(
        { _id: req.user._id },
        { $pull: { favorites: id } }
    );

    return sendFavoriteResponse(req, res, false);
};

module.exports.filterbtn = (req, res) => {
    res.redirect("/listings");
};
