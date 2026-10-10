# Master Architecture Document
## AirBnB Clone By Ritish Kapahi

**Author:** Ritish Kapahi
**Created:** September 2026
**Database:** `RitishMajorProject` (MongoDB)

This document maps out the entire project: every folder, every file, how they connect to each other, and exactly when and where the application talks to the database.

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Complete Directory Structure](#2-complete-directory-structure)
3. [Root-Level Files](#3-root-level-files)
4. [The `models/` Folder](#4-the-models-folder)
5. [The `routers/` Folder](#5-the-routers-folder)
6. [The `controllers/` Folder](#6-the-controllers-folder)
7. [The `views/` Folder](#7-the-views-folder)
8. [The `public/` Folder](#8-the-public-folder)
9. [The `utils/` Folder](#9-the-utils-folder)
10. [The `init/` Folder](#10-the-init-folder)
11. [File Interconnection Map](#11-file-interconnection-map)
12. [Application Workflow: The Request Lifecycle](#12-application-workflow-the-request-lifecycle)
13. [Complete Database Call Reference](#13-complete-database-call-reference)
14. [Data Relationships and Cascading Deletes](#14-data-relationships-and-cascading-deletes)
15. [Authentication & Authorization Flow](#15-authentication--authorization-flow)
16. [Third-Party Service Integration](#16-third-party-service-integration)

---

## 1. Architectural Overview

This application follows the **MVC (Model-View-Controller)** pattern, extended with a dedicated routing layer and a middleware layer.

The layers, in the order a request passes through them:

```
   Browser Request
        │
        ▼
   ┌─────────────┐
   │   app.js    │  Entry point. Global config, session, Passport,
   │             │  then dispatches to the correct router.
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │  routers/   │  Matches the URL + HTTP verb to a handler.
   │             │  Attaches middleware to the route.
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │ middleware  │  Gatekeeping: Is the input valid? Is the user
   │    .js      │  logged in? Do they own this resource?
   └─────────────┘
        │
        ▼
   ┌─────────────┐
   │controllers/ │  The actual logic. THIS IS WHERE ALL DATABASE
   │             │  CALLS HAPPEN.
   └─────────────┘
        │
        ├──────────────┐
        ▼              ▼
   ┌─────────┐    ┌─────────┐
   │ models/ │    │ views/  │  Models talk to MongoDB.
   │         │    │         │  Views render the HTML response.
   └─────────┘    └─────────┘
        │              │
        ▼              ▼
    MongoDB      HTML to Browser
```

**The key architectural rule:** controllers are the only layer that performs database *writes* and primary *reads*. Middleware performs a small number of read-only lookups purely for authorization checks. Models define structure and relationships but do not initiate queries themselves (with the exception of their cascade-delete hooks).

**Why this separation matters (interview-relevant):** if you need to change how a listing is created, you change one controller function. The router, the model, and the view stay untouched. This is what makes an MVC codebase maintainable as it grows.

---

## 2. Complete Directory Structure

```
AirBnB-Clone-By-Ritish-Kapahi/
│
├── app.js                       # ENTRY POINT
├── middleware.js                # Reusable validation/auth/ownership middleware
├── schema.js                    # Joi validation schemas
├── cloudConfig.js               # Cloudinary + Multer configuration
├── package.json                 # Dependencies and project metadata
├── package-lock.json            # Exact locked dependency versions
├── vercel.json                  # Vercel deployment configuration
├── .env                         # Secrets (NOT committed to git)
├── .env.example                 # Template showing required env variables
├── .gitignore                   # Excludes node_modules and .env from git
├── README.md                    # Project overview
├── Master_Doc.md                # This file
├── Interview_QnA.md             # Interview preparation
├── Run_Instructions.md          # Setup and execution guide
│
├── models/                      # DATABASE SCHEMAS
│   ├── listing.js               # Listing schema + cascade-delete hooks
│   ├── review.js                # Review schema
│   └── user.js                  # User schema + passport-local-mongoose plugin
│
├── routers/                     # URL ROUTING
│   ├── listing.js               # /listings/*
│   ├── review.js                # /listings/:id/reviews/*
│   ├── user.js                  # /signup, /login, /logout, /update-*, /delete/*
│   └── profile.js               # /profile/*
│
├── controllers/                 # ROUTE LOGIC + ALL DATABASE CALLS
│   ├── listings.js              # Listing CRUD, search, filter, geocoding
│   ├── reviews.js               # Review create/delete
│   ├── users.js                 # Signup, login, logout, account management
│   └── profiles.js              # Dashboard + bulk deletes
│
├── views/                       # EJS TEMPLATES
│   ├── layouts/
│   │   └── boilerplate.ejs      # Master layout wrapping every page
│   ├── includes/
│   │   ├── navbar.ejs           # Top navigation bar
│   │   ├── footer.ejs           # Site footer
│   │   ├── flash.ejs            # Success/error message banners
│   │   └── filterbtn.ejs        # Mobile filter panel
│   ├── listings/
│   │   ├── index.ejs            # Listings grid (homepage)
│   │   ├── show.ejs             # Single listing detail + map + reviews
│   │   ├── new.ejs              # Create listing form
│   │   ├── edit.ejs             # Edit listing form
│   │   └── error.ejs            # Error page
│   ├── users/
│   │   ├── login.ejs            # Login form
│   │   ├── signup.ejs           # Signup form
│   │   ├── update.ejs           # Account settings (3 tabs)
│   │   └── changeImage.ejs      # Profile image change form
│   └── profiles/
│       └── profile.ejs          # User dashboard
│
├── public/                      # STATIC ASSETS (served to the browser)
│   ├── css/                     # 12 stylesheets
│   ├── js/                      # 14 client-side scripts
│   ├── Icon/                    # UI icons
│   └── images/                  # Static images
│
├── utils/                       # HELPERS
│   ├── wrapAsync.js             # Async error-catching wrapper
│   └── ExpressError.js          # Custom error class with status codes
│
└── init/                        # DATABASE SEEDING
    ├── index.js                 # Seeding script
    └── data.js                  # Sample listing data
```

---

## 3. Root-Level Files

### `app.js` — The Entry Point

This is the file you run (`node app.js`). It executes top-to-bottom on startup and performs six jobs in order:

1. **Loads environment variables** via `dotenv` (skipped in production, where the host injects them directly).
2. **Connects to MongoDB** using `mongoose.connect(process.env.ATLASDB_URL)`. This is a one-time connection held open for the life of the process — it does *not* reconnect per request.
3. **Configures Express**: sets EJS as the view engine, registers `ejs-mate` for layout support, enables `express.urlencoded` for form parsing, `method-override` so HTML forms can send PUT/DELETE, and `express.static` to serve the `public/` folder.
4. **Sets up sessions and authentication**: creates a MongoDB-backed session store (`connect-mongo`), configures the session cookie (7-day rolling expiry, `httpOnly`), initializes Passport with the local strategy, and wires `serializeUser`/`deserializeUser`.
5. **Registers a global `res.locals` middleware** that runs on *every* request, making flash messages and the current user available to every view without any controller having to pass them explicitly.
6. **Mounts the four routers**, adds a catch-all 404 handler, and registers the centralized error-handling middleware last.

**Interacts with:** all four routers, `models/user.js`, `utils/ExpressError.js`, `views/listings/error.ejs`, and `.env`.

**Critical detail:** the error-handling middleware *must* be registered last, and *must* have four parameters (`err, req, res, next`). Express identifies error handlers by their arity — a three-parameter function is treated as normal middleware, not an error handler.

---

### `middleware.js` — The Gatekeeping Layer

A library of 13 reusable middleware functions grouped into three categories:

**Validation middleware** (validates `req.body` against a Joi schema):
| Function | Purpose |
|---|---|
| `validateListing` | Validates listing create/edit form data. Throws a 400 error if invalid. |
| `validateReview` | Validates review rating/comment. Throws a 400 error if invalid. |
| `validateUser` | Validates signup/account-update data. Flashes and redirects instead of throwing, since a bad signup should re-show the form rather than an error page. |

**Authentication middleware:**
| Function | Purpose |
|---|---|
| `isLoggedIn` | Blocks the route unless Passport reports an authenticated session. Saves the attempted URL to the session first. |
| `saveRedirectUrl` | Copies that saved URL into `res.locals` so the login controller can redirect the user back to where they were headed. |

**Authorization middleware** (these perform read-only DB lookups):
| Function | DB Call | Purpose |
|---|---|---|
| `isOwner` | `Listing.findById(id)` | Only the listing's owner may edit/delete it. |
| `isOwnerAll` | `Listing.findOne({owner: id})` | Guards the bulk "delete all my listings" route. |
| `isReviewAuthor` | `Review.findById(reviewId)` | Only the review's author may delete it. |
| `isReviewAuthorProfile` | `Review.findById(reviewId)` | Same check, but redirects to `/listings` (used from the dashboard). |
| `isReviewAll` | `Review.findOne({author: id})` | Guards the bulk "delete all my reviews" route. |
| `isProfileOwner` | `User.findById(id)` | Only the account owner may change their own settings. |
| `varifyEmail` | `User.find({email})` | Rejects signup if the email is already registered. |
| `varifyUserEmail` | `User.find({email})` | Same, but allows the user's own unchanged email through on account update. |

**Why this matters (interview-relevant):** without these ownership guards, any logged-in user could delete anyone else's listing simply by guessing the URL. Authentication answers "who are you?"; authorization answers "are you allowed to do this to *this specific* resource?" Both are required.

---

### `schema.js` — Joi Validation Schemas

Defines three Joi schemas (`listingSchema`, `reviewSchema`, `userSchema`) describing the *expected shape of incoming request bodies*.

**Key distinction (frequently asked in interviews):** Joi schemas validate HTTP request data *before* it reaches the database. Mongoose schemas (`models/`) define the shape of documents *inside* the database. They serve different purposes and operate at different layers. Joi catches a malformed form submission at the edge of the application; Mongoose enforces structural integrity at the data layer.

Note that `password` is not marked `.required()` in `userSchema` because the same schema is reused for the account-update form, which has no password field (password changes go through a separate route).

**Used by:** `middleware.js` only.

---

### `cloudConfig.js` — Cloudinary + Multer Configuration

Configures the Cloudinary SDK from environment variables and builds a `CloudinaryStorage` engine for Multer. Exports two things:

- `cloudinary` — the configured SDK, imported by `controllers/listings.js` to *delete* images.
- `storage` — the Multer storage backend, imported by `routers/listing.js` and `routers/user.js`.

The effect is that uploaded files never touch the server's local disk. Multer parses the `multipart/form-data` request and streams the file straight to Cloudinary, then populates `req.file` with the resulting URL (`req.file.path`) and public ID (`req.file.filename`).

All uploads land in the Cloudinary folder `RitishMajorProject_DEV`, restricted to `png`, `jpg`, and `jpeg` formats.

---

### `package.json`

Declares project metadata and the dependency list. Notable entries: `express`, `mongoose`, `passport`, `passport-local-mongoose`, `express-session`, `connect-mongo`, `connect-flash`, `ejs`, `ejs-mate`, `joi`, `multer`, `multer-storage-cloudinary`, `cloudinary`, `@mapbox/mapbox-sdk`, `method-override`, `dotenv`.

---

### `.env` / `.env.example`

`.env` holds six secrets and is excluded from git via `.gitignore`. `.env.example` is a committed template showing which variables are required, so anyone cloning the repo knows what to configure.

| Variable | Purpose |
|---|---|
| `ATLASDB_URL` | MongoDB connection string (database: `RitishMajorProject`) |
| `SECRET` | Signs session cookies and encrypts the session store |
| `CLOUD_NAME` / `CLOUD_API_KEY` / `CLOUD_API_SECRET` | Cloudinary credentials |
| `MAP_TOKEN` | Mapbox access token |

---

## 4. The `models/` Folder

Mongoose schemas defining the three MongoDB collections and their relationships.

### `models/user.js` → collection `users`

| Field | Type | Notes |
|---|---|---|
| `email` | String | Required |
| `fName` | String | Required (first name) |
| `lName` | String | Optional (last name) |
| `image` | `{url, filename}` | Cloudinary profile image |
| *`username`* | String | **Added automatically by `passport-local-mongoose`** |
| *`hash`* | String | **Added automatically** — the hashed password |
| *`salt`* | String | **Added automatically** — per-user salt |

The `passport-local-mongoose` plugin is the important piece here. Attaching it with `userSchema.plugin(passportLocalMongoose)` adds the `username`/`hash`/`salt` fields plus a set of methods: `User.register()`, `user.authenticate()`, `user.changePassword()`, `User.serializeUser()`, `User.deserializeUser()`.

**Security point worth stating in an interview:** plaintext passwords are never stored and never even appear in the schema. The plugin hashes with a per-user random salt using PBKDF2. This means two users with the same password produce completely different stored hashes, which defeats rainbow-table attacks.

### `models/listing.js` → collection `listings`

| Field | Type | Notes |
|---|---|---|
| `title` | String | Required, **unique** |
| `description` | String | |
| `image` | `{url, filename}` | Cloudinary URL + public ID |
| `price` | Number | |
| `location` | String | |
| `country` | String | |
| `reviews` | `[ObjectId → Review]` | Array of references |
| `owner` | `ObjectId → User` | Reference |
| `geometry` | GeoJSON Point | `{type: "Point", coordinates: [lng, lat]}` |
| `category` | `[String]` | e.g. `["Beachfront", "Trending"]` |

This model also defines **two cascade-delete hooks**, covered in [section 14](#14-data-relationships-and-cascading-deletes).

### `models/review.js` → collection `reviews`

| Field | Type | Notes |
|---|---|---|
| `comment` | String | |
| `rating` | Number | 1–5 |
| `createdAt` | Date | Defaults to `Date.now` (function reference, not a call) |
| `author` | `ObjectId → User` | Reference |
| `listing` | `ObjectId → Listing` | Back-reference to the parent listing |

**Note the `createdAt` detail** — it is `default: Date.now`, not `default: Date.now()`. Passing the function reference lets Mongoose invoke it fresh for each new document. Calling it (with parentheses) would evaluate it once when the schema is compiled at server start, freezing every review to the same timestamp. This was an actual bug found and fixed in this project.

---

## 5. The `routers/` Folder

Each router owns a slice of the URL space and is mounted in `app.js`. Routers do not contain business logic — they map URLs to controller functions and declare which middleware runs first.

### `routers/listing.js` — mounted at `/listings`

| Method | Path | Middleware chain | Controller |
|---|---|---|---|
| GET | `/listings` | — | `index` |
| POST | `/listings` | `isLoggedIn` → `upload.single` → `validateListing` | `createListing` |
| GET | `/listings/new` | `isLoggedIn` | `renderNewForm` |
| GET | `/listings/search` | — | `search` |
| GET | `/listings/filter/:id` | — | `filter` |
| GET | `/listings/filterbtn` | — | `filterbtn` |
| GET | `/listings/:id` | — | `showListing` |
| PUT | `/listings/:id` | `isLoggedIn` → `isOwner` → `upload.single` → `validateListing` | `updateListing` |
| DELETE | `/listings/:id` | `isLoggedIn` → `isOwner` | `destroyListing` |
| GET | `/listings/:id/edit` | `isLoggedIn` → `isOwner` | `renderEditForm` |

**Route ordering matters here.** `/listings/search`, `/listings/new`, `/listings/filter/:id`, and `/listings/filterbtn` are declared *before* `/listings/:id`. Express matches routes in registration order, so if `/listings/:id` came first, a request to `/listings/new` would match it with `id = "new"` and the app would try to look up a listing whose ID is the string "new". This is a classic Express gotcha and a common interview question.

### `routers/review.js` — mounted at `/listings/:id/reviews`

Created with `express.Router({ mergeParams: true })`. Without `mergeParams`, the `:id` from the parent mount path would not be visible inside this router — `req.params.id` would be `undefined`.

| Method | Path | Middleware chain | Controller |
|---|---|---|---|
| POST | `/` | `isLoggedIn` → `validateReview` | `createReview` |
| DELETE | `/:reviewId` | `isLoggedIn` → `isReviewAuthor` | `destroyReview` |

### `routers/user.js` — mounted at `/`

| Method | Path | Middleware chain | Controller |
|---|---|---|---|
| GET/POST | `/signup` | `varifyEmail` → `validateUser` | `renderSignupForm` / `signUser` |
| GET/POST | `/login` | `saveRedirectUrl` → `passport.authenticate` | `renderLoginForm` / `loginUser` |
| GET | `/logout` | — | `logoutUser` |
| GET | `/` | — | redirects to `/listings` |
| GET | `/update-form/:id` | `isLoggedIn` → `isProfileOwner` | `updateFormRender` |
| POST | `/update-password/:id` | `isLoggedIn` → `isProfileOwner` | `updatePassword` |
| POST | `/update-account/:id` | `isLoggedIn` → `isProfileOwner` → `varifyUserEmail` → `validateUser` | `updateAccount` |
| POST | `/update-image/:id` | `isLoggedIn` → `isProfileOwner` → `upload.single` | `updateImage` |
| GET/POST | `/change-image/:id` | `isLoggedIn` → `isProfileOwner` | `renderImageChangeForm` / `updateImage` |
| DELETE | `/delete/:id` | `isLoggedIn` → `isProfileOwner` | `deleteAccount` |

### `routers/profile.js` — mounted at `/profile`

| Method | Path | Middleware chain | Controller |
|---|---|---|---|
| GET | `/profile` | `isLoggedIn` | `profile` |
| DELETE | `/profile/all-listings-delete/:id` | `isLoggedIn` → `isOwnerAll` | `allListingDestroy` |
| DELETE | `/profile/listing/:id` | `isLoggedIn` → `isOwner` | `profileDestroyListing` |
| DELETE | `/profile/all-reviews-delete/:id` | `isLoggedIn` → `isReviewAll` | `allReviewDestroy` |
| DELETE | `/profile/review/:id/:reviewId` | `isLoggedIn` → `isReviewAuthorProfile` | `profileDestroyReview` |

---

## 6. The `controllers/` Folder

**This is where essentially all database interaction happens.** Each controller exports a set of route-handler functions.

### `controllers/listings.js`

| Function | What it does | DB calls |
|---|---|---|
| `geocodeLocation` (helper) | Calls Mapbox to convert location text → coordinates. Returns `null` if no result. | None (external API) |
| `index` | Fetch all listings, newest first | `Listing.find().sort({_id: -1})` |
| `renderNewForm` | Render the create form | None |
| `createListing` | Geocode, build the listing, attach owner + image, save | `newListing.save()` |
| `showListing` | Fetch one listing with reviews (and each review's author) and its owner | `Listing.findById().populate().populate()` |
| `renderEditForm` | Fetch the listing, build a resized preview URL | `Listing.findById()` |
| `updateListing` | Re-geocode, update fields, optionally replace the image | `Listing.findByIdAndUpdate()`, `listing.save()` |
| `destroyListing` | Delete the listing and its Cloudinary image | `Listing.findByIdAndDelete()` (triggers cascade hook) |
| `filter` | Fetch listings matching a category | `Listing.find({category: {$all: [id]}})` |
| `filterbtn` | Render the mobile filter panel | None |
| `search` | Cascading search across five fields | Up to 5 sequential `Listing.find()` calls |

**The search algorithm** is worth understanding for interviews. It normalizes the query to title case, then tries each field in sequence, returning as soon as one produces results:

```
title → category → country → location → price (if the query parses as a number)
```

If all five miss, it flashes "Listings is not here" and redirects. This is a simple, readable approach; its trade-off is that it fires up to five separate queries and cannot match across fields simultaneously. A production system would use a MongoDB text index or Atlas Search instead.

**The image-resize trick** in `renderEditForm` is also worth noting: rather than processing the image server-side, it inserts a transformation segment into the Cloudinary URL (`/upload` → `/upload/w_200,h_150`). Cloudinary generates and caches the resized version on demand. Zero server-side image processing.

### `controllers/reviews.js`

| Function | What it does | DB calls |
|---|---|---|
| `createReview` | Create the review, link it to the listing in both directions | `Listing.findById()`, `newReview.save()`, `listing.save()` |
| `destroyReview` | Remove the review from the listing's array, then delete the document | `Listing.findByIdAndUpdate({$pull})`, `Review.findByIdAndDelete()` |

**Note the two-step pattern.** A review exists in two places: as a document in the `reviews` collection, and as an ObjectId inside its parent listing's `reviews` array. Both must be updated. Deleting only the document would leave a dangling reference in the listing; removing only the reference would leave an orphaned document. The `$pull` operator handles the array side.

### `controllers/users.js`

| Function | What it does | DB calls |
|---|---|---|
| `renderSignupForm` | Render signup form | None |
| `signUser` | Register the user (hashing handled by the plugin), then auto-login | `User.register()` |
| `renderLoginForm` | Render login form | None |
| `loginUser` | Flash welcome + redirect (Passport already verified credentials) | None |
| `logoutUser` | End the session | None |
| `updateFormRender` | Fetch the user for the settings form | `User.findById()` |
| `updateAccount` | Update name/username/email | `User.findByIdAndUpdate()` |
| `updatePassword` | Verify old password, hash and store the new one | `User.findById()`, `user.changePassword()`, `user.save()` |
| `updateImage` | Save new Cloudinary image reference | `User.findById()`, `user.save()` |
| `renderImageChangeForm` | Fetch the user for the image form | `User.findById()` |
| `deleteAccount` | Delete all listings, all reviews, the user, then log out | `Listing.deleteMany()`, `Review.deleteMany()`, `User.findByIdAndDelete()` |

**`deleteAccount` deletion order matters.** Listings are deleted first (which cascades to reviews *on* those listings via the model hook), then any remaining reviews the user wrote on *other people's* listings, then the user document itself. Finally `req.logout()` clears the session — without this the session would still reference a now-deleted user ID, and the next request's `deserializeUser` lookup would fail. This was a real bug fixed in this project.

### `controllers/profiles.js`

| Function | What it does | DB calls |
|---|---|---|
| `profile` | Fetch the user's listings and reviews for the dashboard | `Listing.find({owner}).populate().sort()`, `Review.find({author})` |
| `allListingDestroy` | Bulk-delete every listing this user owns | `Listing.deleteMany({owner: id})` (triggers cascade hook) |
| `profileDestroyListing` | Delete one listing | `Listing.findByIdAndDelete()` |
| `allReviewDestroy` | Loop through the user's reviews, detach each from its listing, then delete | `Review.find()`, then per review: `Listing.findByIdAndUpdate()` + `Review.findByIdAndDelete()` |
| `profileDestroyReview` | Detach and delete one review | `Listing.findByIdAndUpdate()`, `Review.findByIdAndDelete()` |

**Performance caveat worth acknowledging in an interview:** `allReviewDestroy` runs a loop issuing two database calls per review. For a user with 100 reviews that is 200 sequential round-trips. A production implementation would batch this — one `bulkWrite` to pull all the references, one `deleteMany` for the documents. Being able to identify this limitation in your own code is a strong signal to an interviewer.

---

## 7. The `views/` Folder

Server-rendered EJS templates, organized into layouts, reusable includes, and page templates.

### `layouts/boilerplate.ejs`
The master layout. Every page template declares `<% layout("/layouts/boilerplate") %>` and its content gets injected into this file's body by `ejs-mate`. Loads Bootstrap, all shared stylesheets, the navbar, flash messages, the footer, and global scripts. This is why no individual page needs its own `<html>`/`<head>` boilerplate.

### `includes/`
| File | Purpose |
|---|---|
| `navbar.ejs` | Top nav: logo, search box, and a user menu that renders Login/Signup or Profile/Logout depending on whether `currUser` is set |
| `footer.ejs` | Footer links, social icons, author credit |
| `flash.ejs` | Renders the success/error banners from `res.locals.success` / `res.locals.error` |
| `filterbtn.ejs` | Mobile slide-out category filter panel |

### `listings/`
| File | Rendered by | Purpose |
|---|---|---|
| `index.ejs` | `index`, `filter`, `search` | Listing card grid + category filter bar |
| `show.ejs` | `showListing` | Detail page: image, price/tax toggle, map, reviews, add-review form |
| `new.ejs` | `renderNewForm` | Create listing form |
| `edit.ejs` | `renderEditForm` | Edit listing form with current-image preview |
| `error.ejs` | app.js error handler | Error page |

### `users/` and `profiles/`
| File | Rendered by | Purpose |
|---|---|---|
| `login.ejs` | `renderLoginForm` | Login form |
| `signup.ejs` | `renderSignupForm` | Signup form |
| `update.ejs` | `updateFormRender` | Account settings with three tabs |
| `changeImage.ejs` | `renderImageChangeForm` | Standalone image change form |
| `profile.ejs` | `profile` | Dashboard with listings/reviews tabs |

**How `show.ejs` passes data to the map:** it embeds the Mapbox token and the listing's geometry into an inline `<script>` block as global variables, which `public/js/map.js` then reads. This is the bridge between server-rendered data and client-side JavaScript.

---

## 8. The `public/` Folder

Served directly to the browser via `express.static`. Nothing here is processed server-side.

### `public/js/` — 14 client-side scripts

| File | Purpose |
|---|---|
| `script.js` | Global Bootstrap form validation + loading spinner on submit |
| `map.js` | Renders the Mapbox map, marker, popup, and animated pulsing dot |
| `navbar.js` | Search box effect + user dropdown toggle |
| `filter.js` | Category filter highlighting (persisted via `localStorage`) + scroll arrows |
| `filterIcon.js` | Opens/closes the mobile filter panel |
| `delete-confirm.js` | Shows the "are you sure?" overlay before destructive actions |
| `image-preview.js` | Live thumbnail preview before upload (via `FileReader`) |
| `newImg-size.js` / `editImg-size.js` | Client-side 100KB image size guard |
| `tax-info.js` | Toggles pre-tax / post-tax price display |
| `profile.js` | Dashboard listings/reviews tab switching |
| `update.js` | Account settings tab switching |
| `like.js` | Cosmetic heart toggle (**not persisted to the database**) |
| `hide.js` | Disables right-click and DevTools shortcuts |

**Two honest caveats to be ready for in an interview:**

- `like.js` is UI-only. Clicking a heart increments a counter in the DOM and nothing more — refreshing the page resets it. A real favorites feature would need a model, a route, and a controller.
- `hide.js` provides no actual security. Disabling right-click and F12 is trivially bypassed (browser menu, other shortcuts, or disabling JavaScript). It is a minor deterrent, not a protection mechanism. Real protection always belongs server-side.

Similarly, the 100KB image guards in `newImg-size.js`/`editImg-size.js` are client-side only. A determined user could bypass them; the server does not independently enforce a size limit. Worth flagging as a known improvement.

### `public/css/` — 12 stylesheets
`style.css` (global base), `navbar.css`, `footer.css`, `filter.css`, `filterbtn.css`, `show.css`, `profile.css`, `auth-account.css`, `button-style.css`, `delete-confirm.css`, `loder.css`, and `rating.css` (the third-party Starability star-rating widget).

---

## 9. The `utils/` Folder

### `utils/wrapAsync.js`

A higher-order function that wraps an async route handler so any rejected promise is forwarded to Express's error handler:

```js
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
```

**Why it exists:** Express 4 does not automatically catch rejected promises from async functions. Without this wrapper, a failed database call inside an async handler would produce an unhandled promise rejection and the request would hang. The alternative is a try/catch block in every single controller — this wrapper eliminates that repetition.

### `utils/ExpressError.js`

A custom `Error` subclass that carries an HTTP status code:

```js
class ExpressError extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}
```

This lets the centralized error handler respond with a meaningful status (400, 404) rather than defaulting everything to 500.

---

## 10. The `init/` Folder

A standalone seeding script, run manually with `node init/index.js`. It is **not** imported by `app.js`.

- `init/data.js` — 29 sample listings with titles, descriptions, images, prices, locations, and coordinates.
- `init/index.js` — connects to MongoDB, **wipes the entire listings collection** (`Listing.deleteMany({})`), attaches a hard-coded `owner` ID and two random categories to each sample listing, then bulk-inserts them with `insertMany`.

**Two warnings:** the script destroys all existing listings before seeding, so never run it against data you care about. And the hard-coded owner ID must be replaced with a real `User._id` from your own database, or the seeded listings will reference a user that does not exist.

---

## 11. File Interconnection Map

```
                              app.js
                                │
        ┌───────────────┬───────┴───────┬───────────────┐
        ▼               ▼               ▼               ▼
  routers/         routers/        routers/        routers/
  listing.js       review.js       user.js         profile.js
        │               │               │               │
        │  ┌────────────┴───────────────┴───────────────┤
        │  │                                            │
        ▼  ▼                                            ▼
   middleware.js ◄──────── schema.js            cloudConfig.js
        │                                               │
        │  (auth + validation passed)                   │(upload)
        ▼                                               ▼
  controllers/     controllers/   controllers/   controllers/
  listings.js      reviews.js     users.js       profiles.js
        │               │              │               │
        ├───────────────┴──────────────┴───────────────┤
        │                                              │
        ▼                                              ▼
  ┌───────────────────────────────┐            ┌──────────────┐
  │          models/              │            │   views/     │
  │  listing.js ◄──► review.js    │            │  *.ejs       │
  │       ▲            ▲          │            └──────────────┘
  │       └── user.js ─┘          │                    │
  └───────────────────────────────┘                    ▼
                │                              HTML → Browser
                ▼                                      │
           MongoDB                                     ▼
      (RitishMajorProject)                      public/css + public/js

  Cross-cutting: utils/wrapAsync.js wraps every async controller.
                 utils/ExpressError.js is thrown by middleware,
                 caught by app.js's final error handler.
```

**Import relationships in words:**

- `app.js` imports all four routers, `models/user.js`, and `utils/ExpressError.js`.
- Every router imports its controller, `middleware.js`, and `utils/wrapAsync.js`. `routers/listing.js` and `routers/user.js` also import `cloudConfig.js`.
- `middleware.js` imports all three models, `schema.js`, and `utils/ExpressError.js`.
- Controllers import the models they operate on. `controllers/listings.js` additionally imports `cloudConfig.js` (for image deletion) and the Mapbox SDK.
- `models/listing.js` imports `models/review.js` for its cascade-delete hooks.
- Views are rendered by controllers and reference the static assets in `public/`.

---

## 12. Application Workflow: The Request Lifecycle

### Walkthrough A: Creating a Listing (a full write path)

```
1.  Browser: user submits the form at POST /listings (multipart/form-data)
        │
2.  app.js: express.urlencoded, session, Passport (populates req.user),
    res.locals middleware (flash + currUser)
        │
3.  routers/listing.js matches POST "/"
        │
4.  MIDDLEWARE: isLoggedIn
        └─ req.isAuthenticated()? No  → flash + redirect to /login. STOP.
                                  Yes → next()
        │
5.  MIDDLEWARE: upload.single("listing[image]")
        └─ Multer parses the multipart body and streams the file to
           Cloudinary. Populates req.file (.path = URL, .filename = ID)
           and req.body with the text fields.
        │
6.  MIDDLEWARE: validateListing
        └─ Joi validates req.body. Invalid → throw ExpressError(400). STOP.
                                   Valid  → next()
        │
7.  CONTROLLER: createListing (wrapped in wrapAsync)
        ├─ geocodeLocation(location, country)
        │     └─ EXTERNAL API CALL to Mapbox
        │        No result → flash + redirect to /listings/new. STOP.
        ├─ Build the Listing document
        ├─ Attach owner = req.user._id
        ├─ Attach image = {url, filename} from req.file
        ├─ Attach geometry from the geocode result
        └─ ★ DATABASE WRITE: newListing.save()
        │
8.  flash("success") + redirect to /listings
        │
9.  Browser follows the redirect → GET /listings
        └─ ★ DATABASE READ: Listing.find().sort({_id: -1})
        │
10. views/listings/index.ejs renders inside boilerplate.ejs → HTML
```

### Walkthrough B: Viewing a Listing (a read path with population)

```
1.  Browser: GET /listings/:id
2.  app.js global middleware runs
3.  routers/listing.js matches GET "/:id" → showListing
4.  ★ DATABASE READ:
       Listing.findById(id)
         .populate({path: "reviews", populate: {path: "author"}})
         .populate("owner")
    This resolves three levels: the listing, its reviews, and each
    review's author — plus the listing's owner.
5.  Not found → flash + redirect to /listings. STOP.
6.  Render views/listings/show.ejs
7.  The template embeds MAP_TOKEN + listing.geometry into an inline
    <script>, which public/js/map.js reads to draw the Mapbox map.
```

### Walkthrough C: Deleting a Listing (cascade path)

```
1.  Browser: DELETE /listings/:id (via method-override on a form)
2.  MIDDLEWARE: isLoggedIn → authenticated?
3.  MIDDLEWARE: isOwner
       └─ ★ DATABASE READ: Listing.findById(id)
          Compare listing.owner to res.locals.currUser._id
          Mismatch → flash + redirect. STOP.
4.  CONTROLLER: destroyListing
       └─ ★ DATABASE WRITE: Listing.findByIdAndDelete(id)
              │
              └─ ★ MONGOOSE HOOK FIRES (models/listing.js):
                    post("findOneAndDelete")
                    → Review.deleteMany({_id: {$in: listing.reviews}})
                    All of this listing's reviews are deleted.
5.  EXTERNAL: cloudinary.uploader.destroy(image.filename)
       (wrapped in try/catch — a Cloudinary failure must not block
        the listing deletion)
6.  flash("success") + redirect to /listings
```

### Walkthrough D: Login

```
1.  Browser: POST /login with username + password
2.  MIDDLEWARE: saveRedirectUrl
       └─ copies session.redirectUrl into res.locals
3.  MIDDLEWARE: passport.authenticate("local")
       └─ ★ DATABASE READ: looks up the user by username,
          hashes the submitted password with that user's stored salt,
          compares to the stored hash.
          Fail → flash + redirect to /login. STOP.
          Pass → establishes the session, sets req.user
4.  CONTROLLER: loginUser
       └─ flash welcome, redirect to res.locals.redirectUrl || /listings
```

### Walkthrough E: Error Handling

```
Any layer throws or calls next(err)
        │
        ├─ Sync throw in middleware → caught by Express automatically
        ├─ Async rejection in a controller → caught by wrapAsync → next(err)
        └─ No route matched → app.all("*") → next(new ExpressError(404, ...))
        │
        ▼
app.js final error middleware (err, req, res, next)
        └─ Destructure statusCode (default 500) and message
        └─ res.status(statusCode).render("listings/error.ejs", {message})
```

---

## 13. Complete Database Call Reference

Every database interaction in the application, by file.

### Writes

| Location | Call | Trigger |
|---|---|---|
| `controllers/listings.js` | `newListing.save()` | Create a listing |
| `controllers/listings.js` | `Listing.findByIdAndUpdate()` | Edit a listing |
| `controllers/listings.js` | `listing.save()` | Persist geometry/image on edit |
| `controllers/listings.js` | `Listing.findByIdAndDelete()` | Delete a listing |
| `controllers/reviews.js` | `newReview.save()` | Create a review |
| `controllers/reviews.js` | `listing.save()` | Attach review ID to listing |
| `controllers/reviews.js` | `Listing.findByIdAndUpdate({$pull})` | Detach review from listing |
| `controllers/reviews.js` | `Review.findByIdAndDelete()` | Delete a review |
| `controllers/users.js` | `User.register()` | Signup (hashes password) |
| `controllers/users.js` | `User.findByIdAndUpdate()` | Update account details |
| `controllers/users.js` | `user.changePassword()` + `user.save()` | Change password |
| `controllers/users.js` | `user.save()` | Update profile image |
| `controllers/users.js` | `Listing.deleteMany({owner})` | Account deletion |
| `controllers/users.js` | `Review.deleteMany({author})` | Account deletion |
| `controllers/users.js` | `User.findByIdAndDelete()` | Account deletion |
| `controllers/profiles.js` | `Listing.deleteMany({owner})` | Bulk delete listings |
| `controllers/profiles.js` | `Listing.findByIdAndDelete()` | Delete one listing |
| `controllers/profiles.js` | `Listing.findByIdAndUpdate({$pull})` | Detach review |
| `controllers/profiles.js` | `Review.findByIdAndDelete()` | Delete one review |
| `models/listing.js` (hook) | `Review.deleteMany({_id: {$in: ...}})` | Cascade on listing delete |
| `init/index.js` | `Listing.deleteMany({})` + `insertMany()` | Manual seeding |

### Reads

| Location | Call | Trigger |
|---|---|---|
| `controllers/listings.js` | `Listing.find().sort()` | Browse listings |
| `controllers/listings.js` | `Listing.findById().populate().populate()` | View one listing |
| `controllers/listings.js` | `Listing.findById()` | Load edit form |
| `controllers/listings.js` | `Listing.find({category: {$all}})` | Category filter |
| `controllers/listings.js` | Up to 5× `Listing.find({$regex})` | Search |
| `controllers/profiles.js` | `Listing.find({owner}).populate().sort()` | Dashboard |
| `controllers/profiles.js` | `Review.find({author})` | Dashboard |
| `controllers/profiles.js` | `Review.find({author})` | Bulk review delete |
| `controllers/reviews.js` | `Listing.findById()` | Before creating a review |
| `controllers/users.js` | `User.findById()` | Settings form, password change, image update |
| `middleware.js` | `Listing.findById()` | `isOwner` check |
| `middleware.js` | `Listing.findOne({owner})` | `isOwnerAll` check |
| `middleware.js` | `Review.findById()` | `isReviewAuthor` check |
| `middleware.js` | `Review.findOne({author})` | `isReviewAll` check |
| `middleware.js` | `User.findById()` | `isProfileOwner` check |
| `middleware.js` | `User.find({email})` | Email uniqueness checks |
| `models/listing.js` (hook) | `this.model.find(filter)` | Pre-`deleteMany` cascade |
| Passport (`app.js`) | `deserializeUser` lookup | **Every authenticated request** |

**Worth noting:** Passport's `deserializeUser` runs a user lookup on every single authenticated request to rebuild `req.user` from the session's stored user ID. This is the single most frequently executed query in the application.

---

## 14. Data Relationships and Cascading Deletes

### The relationship model

```
     User
      │ 1
      ├──────────────┐
      │ N            │ N
      ▼              ▼
   Listing ◄──────► Review
      1        N
```

- A **User** owns many Listings (`Listing.owner`) and authors many Reviews (`Review.author`).
- A **Listing** has many Reviews, stored as an array of ObjectIds (`Listing.reviews`).
- A **Review** references both its author and its parent listing (`Review.listing`).

This is a **referenced** (normalized) design rather than an embedded one. Reviews live in their own collection and are linked by ID, not nested inside listing documents.

**Why referenced rather than embedded (a common interview question):** embedding would make reading a listing faster (one query instead of a populate), but reviews here need to be queried independently — the profile dashboard shows "all reviews by this user," which would require scanning every listing if reviews were embedded. Referencing also avoids MongoDB's 16MB document size limit on a popular listing. The trade-off is that reads require `.populate()`, and deletes require cleanup in two places.

### The two cascade hooks in `models/listing.js`

**Hook 1 — single delete:**
```js
listingSchema.post("findOneAndDelete", async (listing) => {
  if (listing) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});
```
Fires *after* a single listing is deleted. The deleted document is passed in, so its `reviews` array is available and those review documents can be removed.

**Hook 2 — bulk delete:**
```js
listingSchema.pre("deleteMany", { document: false, query: true }, async function () {
  const listings = await this.model.find(this.getFilter());
  const reviewIds = listings.flatMap((listing) => listing.reviews);
  await Review.deleteMany({ _id: { $in: reviewIds } });
});
```
Fires *before* a bulk delete. This must be a `pre` hook because `deleteMany` does not return the deleted documents — the listings have to be looked up while they still exist in order to know which reviews to clean up.

**The `post` vs `pre` distinction here is a strong interview talking point.** It demonstrates understanding of why the same logical operation needs two different implementations depending on whether Mongoose hands you the deleted documents.

---

## 15. Authentication & Authorization Flow

### Signup
```
POST /signup
  → varifyEmail    : DB read — is this email already registered?
  → validateUser   : Joi validation
  → signUser       : User.register(newUser, password)
                     └─ passport-local-mongoose generates a random salt,
                        hashes the password with PBKDF2, stores hash + salt
                     → req.login() starts the session immediately
```

### Login
```
POST /login
  → saveRedirectUrl
  → passport.authenticate("local")
       └─ DB read: find user by username
       └─ hash submitted password with that user's salt
       └─ constant-time compare against the stored hash
       └─ success → serializeUser stores only user._id in the session
  → loginUser : redirect to the saved URL or /listings
```

### Every subsequent authenticated request
```
Request arrives with a session cookie
  → express-session reads the session from MongoDB
  → passport.session() → deserializeUser(user._id)
       └─ DB read: User.findById() → populates req.user
  → app.js middleware: res.locals.currUser = req.user
       (now every view can check whether someone is logged in)
```

### The two-layer protection model

| Layer | Question answered | Implemented by |
|---|---|---|
| **Authentication** | Who are you? | `isLoggedIn` |
| **Authorization** | May you do this to *this* resource? | `isOwner`, `isReviewAuthor`, `isProfileOwner`, etc. |

Both layers are required on every destructive route. Authentication alone would let any logged-in user delete any listing by guessing its URL.

### Session security measures
- Session data is stored server-side in MongoDB; the cookie holds only a signed session ID.
- The cookie is `httpOnly`, so browser JavaScript cannot read it (mitigates session theft via XSS).
- Session data in the store is encrypted using `SECRET`.
- A 7-day rolling `maxAge` expiry.
- `touchAfter: 24 * 3600` avoids rewriting an unchanged session on every request.

---

## 16. Third-Party Service Integration

### Cloudinary (image storage)

```
Form submit (multipart/form-data)
    → Multer intercepts the file
    → multer-storage-cloudinary streams it to Cloudinary
      (folder: RitishMajorProject_DEV, formats: png/jpg/jpeg)
    → Cloudinary returns a URL and a public_id
    → req.file.path = URL, req.file.filename = public_id
    → Controller stores {url, filename} on the document
```

Both values are stored because the URL is needed to *display* the image and the public ID is needed to *delete* it later.

**Why cloud storage instead of local disk:** files on the local filesystem are lost whenever the application is redeployed or the container restarts — which is exactly how platforms like Vercel, Render, and Heroku operate. Cloud storage also provides a CDN and on-the-fly transformations.

### Mapbox (geocoding + maps)

**Server-side (geocoding):** `controllers/listings.js` calls `forwardGeocode({query: "location,country", limit: 1})` on create and update, converting free-text location into GeoJSON coordinates stored in `listing.geometry`.

The `geocodeLocation` helper guards against zero results — Mapbox legitimately returns an empty feature array for nonsensical input, and reading `features[0].geometry` from an empty array throws a TypeError. This was a real bug fixed in this project; the helper now returns `null` and the controller flashes a friendly error instead of crashing.

**Client-side (map rendering):** `views/listings/show.ejs` passes `MAP_TOKEN` and `listing.geometry` into an inline script; `public/js/map.js` reads them and draws the map with a marker, popup, animated pulsing dot layer, geocoder search, and fullscreen control.

---

## Summary

| Layer | Folder/File | Responsibility |
|---|---|---|
| Entry | `app.js` | Config, DB connection, routing, error handling |
| Routing | `routers/` | URL → controller mapping, middleware attachment |
| Gatekeeping | `middleware.js`, `schema.js` | Validation, authentication, authorization |
| Logic | `controllers/` | **All database operations** |
| Data | `models/` | Schemas, relationships, cascade hooks |
| Presentation | `views/` | Server-rendered EJS templates |
| Client | `public/` | CSS, browser JavaScript, static assets |
| Helpers | `utils/` | Async error wrapper, custom error class |
| Seeding | `init/` | One-off sample data script |

**The single most important flow to be able to recite in an interview:**

```
Request → app.js → router → middleware (auth/validation)
        → controller (DB call) → model → MongoDB
        → view → HTML response
```
