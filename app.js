/**
 * app.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   This is the entry point of the AirBnB Clone application. It is
 *   responsible for:
 *     1. Loading environment variables and connecting to MongoDB.
 *     2. Configuring Express (view engine, static files, body parsing).
 *     3. Setting up sessions, flash messages, and Passport authentication.
 *     4. Mounting all route routers under their base paths.
 *     5. Handling 404s and all uncaught errors (the final error middleware).
 *
 * DEPENDS ON / INTERACTS WITH:
 *   - routers/listing.js, routers/review.js, routers/user.js,
 *     routers/profile.js  -> all incoming HTTP requests are routed here.
 *   - models/user.js       -> used to configure the Passport local strategy.
 *   - utils/ExpressError.js -> used to build the 404 error passed to the
 *     centralized error handler.
 *   - views/listings/error.ejs -> rendered by the final error handler.
 *   - .env (via dotenv)    -> supplies ATLASDB_URL, SECRET, etc.
 *
 * Run with: node app.js  (see Run_Instructions.md for full setup steps)
 * ---------------------------------------------------------------------------
 */

// Only load variables from a local .env file outside production (on
// platforms like Vercel/Render, real env vars are injected directly).
"use strict";

if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override"); // lets HTML forms send PUT/DELETE via ?_method=
const ejsMate = require("ejs-mate"); // adds layout/partial support on top of EJS
const ExpressError = require("./utils/ExpressError.js");
const {
  ensureCsrfToken,
  csrfProtection,
} = require("./utils/csrf.js");

// Route routers - each file owns a slice of the URL space (see file headers
// inside routers/ for the exact paths each one handles).
const listingRouter = require("./routers/listing.js");
const reviewRouter = require("./routers/review.js");
const userRouter = require("./routers/user.js");
const profileRouter = require("./routers/profile.js");
const adminRouter = require("./routers/admin.js");

const session = require("express-session");
const MongoStore = require("connect-mongo"); // persists sessions in MongoDB instead of memory
const flash = require("connect-flash"); // one-time "success"/"error" banners after a redirect
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// --- Database connection ---------------------------------------------------
const isProduction = process.env.NODE_ENV === "production";
const requiredProductionEnv = ["ATLASDB_URL", "SECRET"];
const missingProductionEnv = requiredProductionEnv.filter(
  (key) => !String(process.env[key] || "").trim()
);

if (isProduction && missingProductionEnv.length > 0) {
  throw new Error(
    "Missing required production environment variable(s): " +
      missingProductionEnv.join(", ") +
      "."
  );
}

// Local development may use the local database, but production must always
// use the explicitly configured Atlas connection string.
const DB_URL =
  process.env.ATLASDB_URL ||
  "mongodb://127.0.0.1:27017/RitishMajorProject";

const SESSION_SECRET = process.env.SECRET || "fallbacksecret";

let dbConnectionPromise;

const connectToDatabase = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose
      .connect(DB_URL)
      .then(() => {
        console.log("connected to DB");
      })
      .catch((err) => {
        dbConnectionPromise = null;
        throw err;
      });
  }

  return dbConnectionPromise;
};

// Begin connecting during startup, while the request guard below also makes
// sure a Vercel cold-start request waits for MongoDB before using the routes.
connectToDatabase().catch((err) => {
  console.error("MongoDB connection failed:", err.message);
});

const PORT = process.env.PORT || 8080;

// Vercel imports this file as a serverless handler, while local development
// starts it directly with `node app.js`. Only bind a local port when this file
// is the application entry point; exporting the Express app lets Vercel route
// requests through the same middleware and routers.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`server is listening to port ${PORT}`);
  });
}

if (isProduction) {
  app.set("trust proxy", 1);
}

// --- Express core config ----------------------------------------------------
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true, limit: "100kb" })); // parses HTML form submissions into req.body
app.use(methodOverride("_method")); // reads ?_method=PUT/DELETE from form actions
app.engine("ejs", ejsMate); // enables <% layout('...') %> in views
app.use(express.static(path.join(__dirname, "/public/"))); // serves CSS/JS/images from /public

app.get("/health", (req, res) => {
  const isDatabaseReady = mongoose.connection.readyState === 1;

  res.status(isDatabaseReady ? 200 : 503).json({
    status: isDatabaseReady ? "ok" : "unavailable",
    database: isDatabaseReady ? "connected" : "disconnected",
  });
});

// Vercel can receive the first request before the startup connection finishes.
// Wait for the shared connection promise so cold starts do not race MongoDB.
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

// --- Session store (MongoDB-backed) -----------------------------------------
const store = MongoStore.create({
  mongoUrl: DB_URL,
  crypto: {
    secret: SESSION_SECRET,
  },
  touchAfter: 24 * 3600, // only re-save an unchanged session once per 24h (perf)
});
store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE");
});

const sessionOptions = {
  store,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    // BUG FIX: previously set a static `expires: Date.now() + 7 days`, which is
    // evaluated ONCE when the server boots, so every session (no matter when it
    // was created) expired on the same calendar date. `maxAge` alone lets
    // express-session compute a rolling 7-day expiry per session correctly.
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, // JS in the browser can't read the cookie (XSS mitigation)
    sameSite: "lax",
    secure: isProduction,
  },
};

app.use(session(sessionOptions));
app.use(ensureCsrfToken);
app.use(flash());

// --- Passport (authentication) ----------------------------------------------
app.use(passport.initialize());
app.use(passport.session());
// `User.authenticate()` is provided by passport-local-mongoose; it checks the
// submitted username/password against the hashed password stored in MongoDB.
passport.use(new LocalStrategy(User.authenticate()));

// serializeUser/deserializeUser control what's stored in the session cookie
// (just the user id) and how it's turned back into a full user document on
// each request.
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use(csrfProtection);

// --- Global "locals" middleware ---------------------------------------------
// Runs on every request. Makes flash messages and the logged-in user
// available to every EJS view automatically, without each controller having
// to pass them in explicitly.
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // undefined if nobody is logged in
  const { isAdminUser } = require("./middleware.js");
  res.locals.isAdmin = isAdminUser(req.user);
  const currentPath = req.path.replace(/\/+$/, "") || "/";
  res.locals.showNavbarSearch =
    currentPath === "/listings" ||
    currentPath === "/listings/search" ||
    currentPath.startsWith("/listings/filter/") ||
    /^\/listings\/[a-f\d]{24}$/i.test(currentPath);
  next();
});

// --- Route mounting ----------------------------------------------------------
// Each router only knows about paths relative to its mount point below.
app.use("/", userRouter); // /signup, /login, /logout, /update-* etc.
app.use("/profile", profileRouter); // /profile, /profile/listing/:id, ...
app.use("/listings", listingRouter); // /listings, /listings/:id, /listings/new, ...
app.use("/listings/:id/reviews", reviewRouter); // /listings/:id/reviews, /listings/:id/reviews/:reviewId
app.use("/admin", adminRouter); // administrator listing management

// Catch-all for any URL that didn't match a route above -> 404.
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

// --- Centralized error handler -----------------------------------------------
// Any `next(err)` call anywhere in the app (including errors thrown inside
// async route handlers and caught by wrapAsync) ends up here.
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("listings/error.ejs", { message });
});

module.exports = app;
