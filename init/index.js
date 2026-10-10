/**
 * init/index.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   A one-off seeding script (run manually, not by app.js) that wipes the
 *   Listing collection and repopulates it with the sample data from
 *   init/data.js, assigning each listing a random pair of categories and a
 *   hard-coded owner id. Useful for resetting the database to a known demo
 *   state.
 *
 * DEPENDS ON / INTERACTS WITH:
 *   - init/data.js -> the raw sample listing data seeded here.
 *   - models/listing.js -> the collection being wiped/repopulated.
 *   - .env -> ATLASDB_URL (database = RitishMajorProject).
 *
 * USAGE: node init/index.js   (see Run_Instructions.md)
 * WARNING: this DELETES all existing listings in the target database
 *          before inserting the sample data. Don't run against production
 *          data you care about.
 * ---------------------------------------------------------------------------
 */

if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/RitishMajorProject";
const DB_URL = process.env.ATLASDB_URL;
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => console.log(err));

async function main() {
  // await mongoose.connect(MONGO_URL);
  await mongoose.connect(DB_URL);
}

// Pool of categories randomly assigned to each seeded listing so the
// category filter buttons have something to match against.
let categoryAll = [
  "Beachfront",
  "Cabins",
  "Omg",
  "Lake",
  "Design",
  "Amazing Pools",
  "Farms",
  "Amazing Views",
  "Rooms",
  "Lakefront",
  "Tiny Homes",
  "Countryside",
  "Treehouse",
  "Trending",
  "Tropical",
  "National Parks",
  "Castles",
  "Camping",
  "Top Of The World",
  "Luxe",
  "Iconic Cities",
  "Earth Homes",
];

const initDB = async () => {
  await Listing.deleteMany({}); // DB call: wipe existing listings
  // Attach an owner id and two random categories to every sample listing
  // before inserting (the raw data in data.js has neither).
  initData.data = initData.data.map((obj) => ({
    ...obj,
    owner: "65fbc1dc8ee2ccda05f7194e", // NOTE: replace with a real User _id from your own database
    category: [
      `${categoryAll[Math.floor(Math.random() * 22)]}`,
      `${categoryAll[Math.floor(Math.random() * 22)]}`,
    ],
  }));
  await Listing.insertMany(initData.data); // DB call: bulk insert all sample listings
  console.log("data was initialized");
};
initDB();
