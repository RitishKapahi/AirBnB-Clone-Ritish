/*
 * Add 48 varied demo listings without deleting existing data.
 *
 * Usage: node scripts/seed-listings.js
 *
 * The script is repeatable: a listing is inserted only when its exact title
 * is not already present. It uses an existing user as owner by default, or
 * SEED_OWNER_ID / SEED_OWNER_EMAIL when those values are configured.
 */

"use strict";

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const DB_URL = process.env.ATLASDB_URL ||
    "mongodb://127.0.0.1:27017/RitishMajorProject";

const imageIds = [
    "1600607687920-4e2a09cf159d",
    "1600566753190-17f0baa2a6c3",
    "1600585154340-be6161a56a0c",
    "1600047509807-ba8f99d2cdde",
    "1600566753086-00f18fb6b3ea",
    "1500534623283-312aade485b7",
    "1520250497591-112f2f40a3f4",
    "1564013799919-ab600027ffc6",
    "1566073771259-6a8506099945",
    "1564501049412-61c2a3083791",
    "1542314831-068cd1dbfeeb",
    "1571896349842-33c89424de2d",
];

const specialImages = {
    "Redwood Hideaway": "1500534623283-312aade485b7",
    "Nordic Harbour Room": "1505693416388-ac5ce068fe85",
    "Boathouse on the Lake": "1500375592092-40eb2168fd21",
    "Lighthouse Keeper Cottage": "1499793983690-e29da59ef1c2",
};

const places = [
    ["Oceanlight Apartment", "Lisbon", "Portugal", 1450, -9.1393, 38.7223, "Beachfront", "Flat", "Entire home"],
    ["Alpine Glass Cabin", "Zermatt", "Switzerland", 2800, 7.7491, 46.0207, "Cabins", "House", "Entire home"],
    ["Palm Courtyard House", "Ubud", "Indonesia", 1900, 115.2625, -8.5069, "Tropical", "House", "Entire home"],
    ["Quiet Canal House", "Amsterdam", "Netherlands", 2200, 4.9041, 52.3676, "Design", "House", "Entire home"],
    ["Cliffside Blue Studio", "Santorini", "Greece", 3100, 25.4615, 36.3932, "Amazing Views", "Flat", "Room"],
    ["Redwood Hideaway", "Bend", "United States", 1750, -121.3153, 44.0582, "Countryside", "House", "Entire home"],
    ["Harbour Loft", "Sydney", "Australia", 2400, 151.2093, -33.8688, "Iconic Cities", "Flat", "Entire home"],
    ["Lakeside Cedar Lodge", "Queenstown", "New Zealand", 2600, 168.6626, -45.0312, "Lake", "House", "Entire home"],
    ["Marrakech Riad Retreat", "Marrakech", "Morocco", 1300, -8.0089, 31.6295, "Earth Homes", "Guest house", "Entire home"],
    ["Snowline Chalet", "Banff", "Canada", 2300, -115.5708, 51.1784, "National Parks", "House", "Entire home"],
    ["Sunset Pool House", "Palm Springs", "United States", 2700, -116.5453, 33.8303, "Amazing Pools", "House", "Entire home"],
    ["Old Town Artist Flat", "Prague", "Czech Republic", 1100, 14.4378, 50.0755, "Design", "Flat", "Entire home"],
    ["Jungle Canopy Treehouse", "Monteverde", "Costa Rica", 1600, -84.8256, 10.3157, "Treehouse", "Guest house", "Entire home"],
    ["Kyoto Garden Machiya", "Kyoto", "Japan", 1850, 135.7681, 35.0116, "Iconic Cities", "House", "Entire home"],
    ["Azure Cove Bungalow", "Goa", "India", 900, 73.8567, 15.2993, "Beachfront", "Guest house", "Entire home"],
    ["Stone Farmhouse Escape", "Provence", "France", 2050, 5.3698, 43.2965, "Farms", "House", "Entire home"],
    ["Desert Dome Retreat", "Wadi Rum", "Jordan", 1200, 35.4194, 29.5321, "Domes", "Hotel", "Room"],
    ["Nordic Harbour Room", "Reykjavik", "Iceland", 1350, -21.9426, 64.1466, "Arctic", "Flat", "Room"],
    ["Vineyard View Cottage", "Napa", "United States", 2500, -122.2869, 38.2975, "Farms", "House", "Entire home"],
    ["Seaside Cycladic Home", "Paros", "Greece", 2100, 25.1482, 37.0853, "Beachfront", "House", "Entire home"],
    ["Rainforest River Cabin", "La Fortuna", "Costa Rica", 1550, -84.6436, 10.467, "Cabins", "House", "Entire home"],
    ["Elegant Milan Residence", "Milan", "Italy", 1700, 9.19, 45.4642, "Iconic Cities", "Flat", "Entire home"],
    ["Rooftop Medina Suite", "Fez", "Morocco", 1000, -5.0033, 34.0331, "Luxe", "Guest house", "Room"],
    ["Wildflower Mountain Home", "Boulder", "United States", 1950, -105.2705, 40.015, "Mountains", "House", "Entire home"],
    ["Minimalist Seoul Loft", "Seoul", "South Korea", 1450, 126.978, 37.5665, "Design", "Flat", "Entire home"],
    ["Tropical Lagoon House", "Tulum", "Mexico", 2300, -87.4654, 20.2114, "Tropical", "House", "Entire home"],
    ["Historic Edinburgh Flat", "Edinburgh", "United Kingdom", 1250, -3.1883, 55.9533, "Castles", "Flat", "Entire home"],
    ["Clifftop Amalfi Stay", "Amalfi", "Italy", 2900, 14.6027, 40.634, "Amazing Views", "Flat", "Room"],
    ["Sakura Hillside Home", "Hakone", "Japan", 1800, 139.023, 35.2324, "Mountains", "House", "Entire home"],
    ["Boathouse on the Lake", "Annecy", "France", 2150, 6.1294, 45.8992, "Lake", "Guest house", "Entire home"],
    ["Coastal Surf Cottage", "Ericeira", "Portugal", 1400, -9.4153, 38.9628, "Beachfront", "House", "Entire home"],
    ["Canyon Star Camp", "Moab", "United States", 1150, -109.5498, 38.5733, "Camping", "Hotel", "Room"],
    ["Bohemian Old Port Flat", "Marseille", "France", 1200, 5.3698, 43.2965, "Iconic Cities", "Flat", "Entire home"],
    ["Tea Estate Bungalow", "Munnar", "India", 850, 77.0595, 10.0889, "Countryside", "House", "Entire home"],
    ["Treetop Nordic Sauna", "Rovaniemi", "Finland", 1550, 25.7294, 66.5039, "Arctic", "Guest house", "Entire home"],
    ["Golden Dunes House", "Maspalomas", "Spain", 1650, -15.586, 27.7606, "Amazing Pools", "House", "Entire home"],
    ["Tuscan Stone Loft", "Siena", "Italy", 1900, 11.3308, 43.3188, "Farms", "House", "Entire home"],
    ["Glasshouse Above the City", "Cape Town", "South Africa", 2250, 18.4241, -33.9249, "Amazing Views", "Flat", "Entire home"],
    ["Forest Sauna Cabin", "Tallinn", "Estonia", 1050, 24.7536, 59.437, "Cabins", "House", "Entire home"],
    ["Island Garden Guesthouse", "Koh Samui", "Thailand", 1350, 100.0627, 9.512, "Tropical", "Guest house", "Room"],
    ["Andean Balcony Apartment", "Cusco", "Peru", 980, -71.9675, -13.5319, "Mountains", "Flat", "Entire home"],
    ["Lighthouse Keeper Cottage", "Dingle", "Ireland", 1500, -10.2687, 52.1408, "Amazing Views", "House", "Entire home"],
    ["Lake Como Garden Villa", "Como", "Italy", 2750, 9.0852, 45.8081, "Lake", "House", "Entire home"],
    ["Cobalt Desert Casita", "Joshua Tree", "United States", 1450, -116.3131, 34.1347, "Earth Homes", "Guest house", "Entire home"],
    ["Urban Garden Hideout", "Berlin", "Germany", 1300, 13.405, 52.52, "Design", "Flat", "Entire home"],
    ["Coral Coast Apartment", "Cairns", "Australia", 1650, 145.77, -16.9186, "Beachfront", "Flat", "Entire home"],
    ["Himalayan Window Room", "Manali", "India", 800, 77.1892, 32.2396, "Mountains", "Guest house", "Room"],
    ["Volcanic Coast House", "Lanzarote", "Spain", 1850, -13.5378, 28.963, "Luxe", "House", "Entire home"],
    ["Quiet Countryside Manor", "Cotswolds", "United Kingdom", 2400, -1.8433, 51.833, "Countryside", "House", "Entire home"],
];

const slugify = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const listings = places.map((place, index) => {
    const [title, location, country, price, longitude, latitude, category, propertyType, placeType] = place;
    const amenities = ["Wifi", "Kitchen"];

    if (index % 2 === 0) amenities.push("Air conditioning");
    if (index % 3 === 0) amenities.push("Heating");
    if (index % 4 === 0) amenities.push("Washing machine");

    return {
        title,
        description: `A carefully designed ${propertyType.toLowerCase()} in ${location}, ideal for a memorable stay in ${country}.`,
        image: {
            filename: `demo-seed/${slugify(title)}`,
            url: `https://images.unsplash.com/photo-${specialImages[title] || imageIds[index % imageIds.length]}?auto=format&fit=crop&w=1200&q=82`,
        },
        price,
        location,
        country,
        placeType,
        propertyType,
        bedrooms: propertyType === "Flat" ? 1 + (index % 3) : 2 + (index % 4),
        beds: 1 + (index % 5),
        bathrooms: 1 + (index % 3),
        amenities,
        instantBook: index % 2 === 0,
        selfCheckIn: index % 3 !== 1,
        allowsPets: index % 4 === 0,
        accessibilityFeatures: index % 5 === 0 ? ["step-free-entrance"] : [],
        hostLanguages: index % 3 === 0 ? ["English", "French"] : ["English"],
        category: [category],
        geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
        },
    };
});

const findOwner = async () => {
    if (process.env.SEED_OWNER_ID && mongoose.isValidObjectId(process.env.SEED_OWNER_ID)) {
        return User.findById(process.env.SEED_OWNER_ID);
    }

    if (process.env.SEED_OWNER_EMAIL) {
        return User.findOne({ email: process.env.SEED_OWNER_EMAIL.toLowerCase().trim() });
    }

    return User.findOne().sort({ createdAt: 1, _id: 1 });
};

const main = async () => {
    await mongoose.connect(DB_URL);

    const owner = await findOwner();

    if (!owner) {
        throw new Error("No user exists for the seeded listings. Create an account first or set SEED_OWNER_ID/SEED_OWNER_EMAIL.");
    }

    const titles = listings.map(({ title }) => title);
    const existingTitles = new Set(
        await Listing.distinct("title", { title: { $in: titles } })
    );

    const pending = listings
        .filter(({ title }) => !existingTitles.has(title))
        .map((listing) => ({ ...listing, owner: owner._id }));

    if (pending.length > 0) {
        await Listing.insertMany(pending);
    }

    console.log(`Seed complete: inserted ${pending.length} listing(s); ${existingTitles.size} already existed.`);
};

main()
    .catch((error) => {
        console.error("Listing seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
