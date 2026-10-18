/**
 * Create a repeatable fictional marketplace community for demos.
 *
 * Safe by default: without --apply this prints a plan and does not connect to
 * MongoDB. Remote databases additionally require --allow-remote.
 *
 * Local:  node scripts/seed-demo-community.js --apply
 * Atlas:  node scripts/seed-demo-community.js --apply --allow-remote
 */

"use strict";

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../models/user.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

const configuredDemoPassword = process.env.SEED_DEMO_PASSWORD;
const profileNames = [
    ["Ava", "Bennett"], ["Noah", "Carter"], ["Maya", "Shah"],
    ["Leo", "Martinez"], ["Sofia", "Kim"], ["Ethan", "Brooks"],
    ["Amara", "Okafor"], ["Luca", "Moretti"], ["Zara", "Khan"],
    ["Theo", "Laurent"], ["Ivy", "Chen"], ["Arjun", "Mehta"],
    ["Mila", "Petrov"], ["Owen", "Reed"], ["Nina", "Sato"],
    ["Mateo", "Rivera"], ["Freya", "Larsen"], ["Samir", "Haddad"],
    ["Grace", "Wilson"], ["Ravi", "Nair"], ["Elena", "Garcia"],
    ["Finn", "Andersen"], ["Layla", "Hassan"], ["Hugo", "Silva"],
    ["Priya", "Kapoor"], ["Mason", "Clarke"], ["Anika", "Das"],
    ["Kai", "Tanaka"], ["Isla", "Campbell"], ["Omar", "Farouk"],
    ["Chloe", "Dubois"], ["Dev", "Patel"], ["Lucia", "Romano"],
    ["Elias", "Johansson"], ["Mei", "Lin"], ["Adam", "Nowak"],
    ["Aisha", "Rahman"], ["Ben", "Foster"], ["Camila", "Costa"],
    ["Jonah", "Price"], ["Leila", "Mansour"], ["Rohan", "Iyer"],
    ["Eva", "Schneider"], ["Gabriel", "Santos"], ["Tara", "Murphy"],
];

const destinations = [
    ["Lisbon", "Portugal", -9.1393, 38.7223, "Beachfront"],
    ["Zermatt", "Switzerland", 7.7491, 46.0207, "Mountains"],
    ["Ubud", "Indonesia", 115.2625, -8.5069, "Tropical"],
    ["Amsterdam", "Netherlands", 4.9041, 52.3676, "Design"],
    ["Santorini", "Greece", 25.4615, 36.3932, "Amazing Views"],
    ["Bend", "United States", -121.3153, 44.0582, "Countryside"],
    ["Sydney", "Australia", 151.2093, -33.8688, "Iconic Cities"],
    ["Queenstown", "New Zealand", 168.6626, -45.0312, "Lake"],
    ["Marrakech", "Morocco", -8.0089, 31.6295, "Earth Homes"],
    ["Banff", "Canada", -115.5708, 51.1784, "National Parks"],
    ["Palm Springs", "United States", -116.5453, 33.8303, "Amazing Pools"],
    ["Prague", "Czech Republic", 14.4378, 50.0755, "Design"],
    ["Monteverde", "Costa Rica", -84.8256, 10.3157, "Treehouse"],
    ["Kyoto", "Japan", 135.7681, 35.0116, "Iconic Cities"],
    ["Goa", "India", 73.8567, 15.2993, "Beachfront"],
    ["Provence", "France", 5.3698, 43.2965, "Farms"],
    ["Wadi Rum", "Jordan", 35.4194, 29.5321, "Earth Homes"],
    ["Reykjavik", "Iceland", -21.9426, 64.1466, "Amazing Views"],
    ["Napa", "United States", -122.2869, 38.2975, "Farms"],
    ["Paros", "Greece", 25.1482, 37.0853, "Beachfront"],
    ["La Fortuna", "Costa Rica", -84.6436, 10.467, "Cabins"],
    ["Milan", "Italy", 9.19, 45.4642, "Iconic Cities"],
    ["Fez", "Morocco", -5.0033, 34.0331, "Earth Homes"],
    ["Boulder", "United States", -105.2705, 40.015, "Mountains"],
    ["Seoul", "South Korea", 126.978, 37.5665, "Design"],
    ["Tulum", "Mexico", -87.4654, 20.2114, "Tropical"],
    ["Edinburgh", "United Kingdom", -3.1883, 55.9533, "Castles"],
    ["Amalfi", "Italy", 14.6027, 40.634, "Amazing Views"],
    ["Hakone", "Japan", 139.023, 35.2324, "Lake"],
    ["Annecy", "France", 6.1294, 45.8992, "Lake"],
    ["Ericeira", "Portugal", -9.4153, 38.9628, "Beachfront"],
    ["Moab", "United States", -109.5498, 38.5733, "National Parks"],
    ["Marseille", "France", 5.3694, 43.2965, "Iconic Cities"],
    ["Munnar", "India", 77.0595, 10.0889, "Countryside"],
    ["Rovaniemi", "Finland", 25.7294, 66.5039, "Amazing Views"],
    ["Maspalomas", "Spain", -15.586, 27.7606, "Amazing Pools"],
    ["Siena", "Italy", 11.3308, 43.3188, "Farms"],
    ["Cape Town", "South Africa", 18.4241, -33.9249, "Amazing Views"],
    ["Tallinn", "Estonia", 24.7536, 59.437, "Cabins"],
    ["Koh Samui", "Thailand", 100.0627, 9.512, "Tropical"],
    ["Cusco", "Peru", -71.9675, -13.5319, "Mountains"],
    ["Dingle", "Ireland", -10.2687, 52.1408, "Amazing Views"],
    ["Como", "Italy", 9.0852, 45.8081, "Lake"],
    ["Joshua Tree", "United States", -116.3131, 34.1347, "Earth Homes"],
    ["Berlin", "Germany", 13.405, 52.52, "Design"],
    ["Vancouver", "Canada", -123.1207, 49.2827, "Beachfront"],
];

const listingStyles = [
    "Sunlit Courtyard Stay", "Cedar Hideaway", "Harbour View Loft",
    "Garden House Retreat", "Quiet Design Apartment", "Lakeview Cabin",
    "Old Town Residence", "Palm Terrace Home", "Forest Edge Cottage",
    "Skyline Guest Suite", "Olive Grove Villa", "Coastal Morning House",
];

const propertyTypes = ["House", "Flat", "Guest house", "Hotel"];
const amenitiesList = [
    "Wifi", "Kitchen", "Washing machine", "Dryer",
    "Air conditioning", "Heating",
];
const languages = ["English", "French", "German", "Japanese"];
const listingPhotos = [
    "1600607687920-4e2a09cf159d", "1600566753190-17f0baa2a6c3",
    "1600585154340-be6161a56a0c", "1600047509807-ba8f99d2cdde",
    "1600566753086-00f18fb6b3ea", "1500534623283-312aade485b7",
    "1520250497591-112f2f40a3f4", "1564013799919-ab600027ffc6",
    "1566073771259-6a8506099945", "1564501049412-61c2a3083791",
    "1542314831-068cd1dbfeeb", "1571896349842-33c89424de2d",
    "1505693416388-ac5ce068fe85", "1500375592092-40eb2168fd21",
    "1499793983690-e29da59ef1c2", "1552733407-5d5c46c3bb3b",
    "1501785888041-af3ef285b470", "1571003123894-1f0594d2b5d9",
];
const reviewComments = [
    "The photos were accurate and the place felt thoughtfully prepared. We especially enjoyed the neighborhood guide.",
    "A lovely base for exploring. Check-in was simple, communication was quick, and the space was comfortable.",
    "We had a relaxing stay and appreciated the clean rooms, useful kitchen, and small welcoming touches.",
    "Great location for our plans. The home had the essentials we needed and the host was easy to reach.",
    "A memorable few days with beautiful surroundings. The listing details matched what we found on arrival.",
    "Comfortable beds and a calm atmosphere made this a good place to recharge after busy days out.",
    "The host shared excellent local recommendations. We would happily consider this stay again.",
    "A good overall stay. The space was tidy, the instructions were clear, and getting around was easy.",
];

const slugify = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const buildDemoDataset = () => {
    const users = profileNames.map(([fName, lName], index) => {
        const number = String(index + 1).padStart(2, "0");
        const gender = index % 2 === 0 ? "women" : "men";
        const portrait = (index % 45) + 1;

        return {
            demoSeedKey: `community-user-${number}`,
            fName,
            lName,
            username: `demo_${slugify(fName)}_${slugify(lName)}_${number}`,
            email: `demo.host.${number}@example.test`,
            image: {
                filename: `demo-community/profile-${number}`,
                url: `https://randomuser.me/api/portraits/${gender}/${portrait}.jpg`,
            },
        };
    });

    const listings = [];
    const reviews = [];

    users.forEach((host, hostIndex) => {
        const [city, country, longitude, latitude, category] =
            destinations[hostIndex];
        const hostListingCount = 3 + (hostIndex % 2);

        for (let localIndex = 0; localIndex < hostListingCount; localIndex += 1) {
            const globalIndex = listings.length;
            const style = listingStyles[
                (hostIndex * 2 + localIndex * 3) % listingStyles.length
            ];
            const propertyType = propertyTypes[
                (hostIndex + localIndex) % propertyTypes.length
            ];
            const placeType = (hostIndex + localIndex) % 4 === 0
                ? "Room"
                : "Entire home";
            const bedrooms = placeType === "Room"
                ? 1
                : 1 + ((hostIndex + localIndex) % 4);
            const beds = bedrooms + ((hostIndex + localIndex) % 2);
            const bathrooms = 1 + ((hostIndex + localIndex) % 3);
            const amenities = amenitiesList.filter((_, amenityIndex) =>
                (hostIndex + localIndex + amenityIndex) % 3 !== 0
            );
            const listingKey = `community-listing-${String(hostIndex + 1).padStart(2, "0")}-${localIndex + 1}`;
            const listing = {
                demoSeedKey: listingKey,
                title: `${style} in ${city}`,
                description: [
                    `A welcoming ${propertyType.toLowerCase()} in ${city}, ${country}, with a considered layout and an easy base for exploring the area.`,
                    `The home sleeps ${beds} guests across ${bedrooms} bedroom${bedrooms === 1 ? "" : "s"}, with ${bathrooms} bathroom${bathrooms === 1 ? "" : "s"}. Guests have ${amenities.join(", ")}.`,
                    `${host.fName} is your local host and shares practical arrival notes and favorite nearby places before check-in. Ideal for a relaxed city break or a slower longer stay.`,
                ].join("\n\n"),
                image: {
                    filename: `demo-community/${listingKey}`,
                    url: `https://images.unsplash.com/photo-${listingPhotos[globalIndex % listingPhotos.length]}?auto=format&fit=crop&w=1200&q=82`,
                },
                price: 850 + ((hostIndex * 317 + localIndex * 425) % 6800),
                location: city,
                country,
                placeType,
                propertyType,
                bedrooms,
                beds,
                bathrooms,
                amenities,
                instantBook: (hostIndex + localIndex) % 2 === 0,
                selfCheckIn: (hostIndex + localIndex) % 3 !== 1,
                allowsPets: (hostIndex + localIndex) % 4 === 0,
                accessibilityFeatures: (hostIndex + localIndex) % 5 === 0
                    ? ["step-free-entrance"]
                    : [],
                hostLanguages: [
                    "English",
                    languages[(hostIndex + localIndex) % languages.length],
                ].filter((language, index, all) => all.indexOf(language) === index),
                category: [category],
                ownerKey: host.demoSeedKey,
                geometry: {
                    type: "Point",
                    coordinates: [
                        Number((longitude + (localIndex - 1) * 0.008).toFixed(6)),
                        Number((latitude + (localIndex - 1) * 0.006).toFixed(6)),
                    ],
                },
            };

            listings.push(listing);

            const reviewCount = 3 + ((hostIndex + localIndex) % 2);
            for (let reviewIndex = 0; reviewIndex < reviewCount; reviewIndex += 1) {
                let reviewerIndex =
                    (hostIndex + 7 + localIndex * 3 + reviewIndex * 11) % users.length;
                if (reviewerIndex === hostIndex) {
                    reviewerIndex = (reviewerIndex + 1) % users.length;
                }

                const reviewer = users[reviewerIndex];
                const reviewKey = `${listingKey}-review-${reviewIndex + 1}`;
                const comment = reviewComments[
                    (globalIndex + reviewIndex * 3) % reviewComments.length
                ];

                reviews.push({
                    demoSeedKey: reviewKey,
                    listingKey,
                    authorKey: reviewer.demoSeedKey,
                    rating: [5, 4, 5, 4, 3, 5, 4][
                        (hostIndex + localIndex + reviewIndex) % 7
                    ],
                    comment: `${comment} ${city} was a wonderful part of the trip.`,
                    createdAt: new Date(Date.UTC(
                    2024 + (globalIndex % 2),
                        (globalIndex + reviewIndex) % 12,
                        5 + ((hostIndex + reviewIndex) % 22)
                    )),
                });
            }
        }
    });

    return { users, listings, reviews };
};

const seedDatabase = async (dataset) => {
    const userByKey = new Map();
    const existingUsers = await User.find({
        demoSeedKey: { $in: dataset.users.map((user) => user.demoSeedKey) },
    }).select("+demoSeedKey");

    for (const user of existingUsers) {
        userByKey.set(user.demoSeedKey, user);
    }

    let usersInserted = 0;
    for (const userData of dataset.users) {
        if (userByKey.has(userData.demoSeedKey)) continue;

        const conflictingUser = await User.findOne({
            $or: [
                { email: userData.email },
                { username: userData.username },
            ],
        });
        if (conflictingUser) {
            throw new Error(
                `A user already uses demo identity ${userData.username}; no records were overwritten.`
            );
        }

        const password = configuredDemoPassword ||
            crypto.randomBytes(32).toString("base64url");
        const user = await User.register(new User(userData), password);
        userByKey.set(userData.demoSeedKey, user);
        usersInserted += 1;
    }

    const listingKeys = dataset.listings.map((listing) => listing.demoSeedKey);
    const existingListings = await Listing.find({
        demoSeedKey: { $in: listingKeys },
    }).select("+demoSeedKey");
    const listingByKey = new Map(
        existingListings.map((listing) => [listing.demoSeedKey, listing])
    );
    const missingListings = dataset.listings
        .filter((listing) => !listingByKey.has(listing.demoSeedKey))
        .map(({ ownerKey, ...listing }) => ({
            ...listing,
            owner: userByKey.get(ownerKey)._id,
        }));

    let listingsInserted = 0;
    if (missingListings.length) {
        const inserted = await Listing.insertMany(missingListings);
        for (const listing of inserted) {
            listingByKey.set(listing.demoSeedKey, listing);
        }
        listingsInserted = inserted.length;
    }

    const existingReviews = await Review.find({
        demoSeedKey: { $in: dataset.reviews.map((review) => review.demoSeedKey) },
    }).select("+demoSeedKey");
    const reviewByKey = new Map(
        existingReviews.map((review) => [review.demoSeedKey, review])
    );
    const missingReviews = dataset.reviews
        .filter((review) => !reviewByKey.has(review.demoSeedKey))
        .map((review) => ({
            demoSeedKey: review.demoSeedKey,
            listing: listingByKey.get(review.listingKey)._id,
            author: userByKey.get(review.authorKey)._id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
        }));

    let reviewsInserted = 0;
    if (missingReviews.length) {
        const inserted = await Review.insertMany(missingReviews);
        for (const review of inserted) {
            reviewByKey.set(review.demoSeedKey, review);
        }
        reviewsInserted = inserted.length;
    }

    const reviewIdsByListing = new Map();
    for (const reviewData of dataset.reviews) {
        const review = reviewByKey.get(reviewData.demoSeedKey);
        if (!reviewIdsByListing.has(reviewData.listingKey)) {
            reviewIdsByListing.set(reviewData.listingKey, []);
        }
        reviewIdsByListing.get(reviewData.listingKey).push(review._id);
    }

    await Listing.bulkWrite(
        [...reviewIdsByListing].map(([listingKey, reviewIds]) => ({
            updateOne: {
                filter: { _id: listingByKey.get(listingKey)._id },
                update: { $addToSet: { reviews: { $each: reviewIds } } },
            },
        }))
    );

    return { usersInserted, listingsInserted, reviewsInserted };
};

const main = async () => {
    const dataset = buildDemoDataset();
    const args = new Set(process.argv.slice(2));
    const listingCountByHost = dataset.listings.reduce((counts, listing) => {
        counts.set(listing.ownerKey, (counts.get(listing.ownerKey) || 0) + 1);
        return counts;
    }, new Map());

    console.log(
        `Demo community plan: ${dataset.users.length} users, ` +
        `${dataset.listings.length} listings (${Math.min(...listingCountByHost.values())}–${Math.max(...listingCountByHost.values())} each), ` +
        `${dataset.reviews.length} reviews (3–4 per listing).`
    );

    if (!args.has("--apply")) {
        console.log("Dry run only; MongoDB was not contacted. Add --apply to write the demo records.");
        return;
    }

    const databaseUrl = process.env.ATLASDB_URL ||
        "mongodb://127.0.0.1:27017/RitishMajorProject";
    const isLocalDatabase = /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(databaseUrl);

    if (!isLocalDatabase && !args.has("--allow-remote")) {
        throw new Error(
            "Refusing to write to a remote database without --allow-remote. This seed inserts demo users, listings, and reviews into the shared database."
        );
    }

    let targetDatabase;
    try {
        targetDatabase = new URL(databaseUrl).pathname
            .replace(/^\/+/, "")
            .split("/")[0];
    } catch (error) {
        throw new Error("ATLASDB_URL is not a valid MongoDB connection string.");
    }

    if (targetDatabase !== "RitishMajorProject") {
        throw new Error(
            `Refusing to seed database "${targetDatabase || "(unspecified)"}"; expected RitishMajorProject.`
        );
    }

    await mongoose.connect(databaseUrl);
    try {
        const counts = await seedDatabase(dataset);
        console.log(
            `Seed complete: inserted ${counts.usersInserted} user(s), ` +
            `${counts.listingsInserted} listing(s), and ${counts.reviewsInserted} review(s). ` +
            "Existing marked demo records were reused."
        );
        console.log(configuredDemoPassword
            ? "New demo accounts use the SEED_DEMO_PASSWORD value configured in your environment."
            : "Demo accounts received private random passwords that were not displayed; set SEED_DEMO_PASSWORD before seeding if demo logins are needed."
        );
    } finally {
        await mongoose.disconnect();
    }
};

if (require.main === module) {
    main().catch((error) => {
        console.error("Demo community seed failed:", error.message);
        process.exitCode = 1;
    });
}

module.exports = { buildDemoDataset };
