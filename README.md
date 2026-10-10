# AirBnB Clone By Ritish Kapahi

A full-stack, Airbnb-inspired property rental web application built with Node.js, Express, MongoDB, and EJS. Users can browse and search property listings, create their own listings with photos and map locations, leave reviews, and manage their account through a personal dashboard.

**Author:** Ritish Kapahi
**Created:** September 2026
**Database:** `RitishMajorProject` (MongoDB)

---

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Author](#author)

---

## Description

This project is a server-rendered (MVC) web application that reproduces the core functionality of a property-rental marketplace. It is built on the MongoDB + Express + Node.js stack, with EJS templates rendering the frontend on the server rather than using a separate client-side framework.

The application demonstrates a complete end-to-end feature set: session-based authentication with hashed passwords, full CRUD operations on two related data models, image upload to a third-party cloud service, geocoding of user-entered addresses into map coordinates, authorization rules that restrict edits to resource owners, and cascading deletes that keep related documents from becoming orphaned.

Architecturally it follows a clear MVC separation:

- **Models** (`models/`) define the MongoDB document shapes and relationships.
- **Views** (`views/`) are EJS templates rendered server-side.
- **Controllers** (`controllers/`) hold the route logic and all database calls.
- **Routers** (`routers/`) map URLs to controllers and attach middleware.
- **Middleware** (`middleware.js`) handles validation, authentication, and authorization before a request reaches its controller.

For a complete file-by-file breakdown and request-flow walkthrough, see [`Master_Doc.md`](./Master_Doc.md).

---

## Features

### Authentication & Accounts
- User signup, login, and logout using Passport.js (local strategy)
- Passwords hashed and salted automatically via `passport-local-mongoose` — plaintext passwords are never stored
- Sessions persisted in MongoDB (survive server restarts) with a rolling 7-day expiry
- Post-login redirect back to the page the user originally tried to reach
- Account management: update profile details, change password (verifies the old password first), upload/change a profile image
- Full account deletion, which also removes all of that user's listings and reviews

### Listings
- Create, read, update, and delete property listings
- Image upload handled by Multer and stored on Cloudinary (not on the local disk)
- Location and country text automatically geocoded into map coordinates via the Mapbox API
- Interactive Mapbox map on each listing page with a marker, popup, animated pulsing dot, geocoder search, and fullscreen control
- Price display with a toggle between pre-tax and post-tax totals
- Only the listing owner can edit or delete their own listing

### Reviews
- Leave a star rating (1–5) and a comment on any listing
- Reviews display the author and creation timestamp
- Only the review's author can delete their own review
- Deleting a listing automatically cascade-deletes all of its reviews (handled by Mongoose schema hooks)

### Search & Filtering
- Search bar with a case-insensitive match across title, description, location, country, and category
- Category filter bar (Beachfront, Cabins, Amazing Pools, Treehouse, Castles, and more) with a horizontally scrollable button strip
- Selected advanced-filter values persist in the URL query string
- Dedicated mobile filter panel
- Authenticated users can save and remove listing favourites from the listing cards

### User Dashboard
- Personal profile page showing all listings you own and all reviews you've written
- Tabbed interface to switch between listings and reviews
- Delete individual items, or bulk-delete all your listings or all your reviews at once

### Validation, Security & UX
- Server-side request validation with Joi schemas on every write operation
- Client-side HTML5 form validation with Bootstrap styling
- Ownership and authorship middleware guards on every destructive route
- `httpOnly` session cookies (not readable by browser JavaScript)
- Centralized error handling with a custom `ExpressError` class and a dedicated error page
- Flash messages for success and error feedback after every action
- Delete-confirmation dialogs before destructive actions
- Loading spinner and disabled submit button during form submission (prevents double-submits)
- Live image preview before upload
- Responsive layout for mobile and desktop

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime for the server |
| **Express.js** | Web framework, routing, and middleware pipeline |
| **MongoDB** | NoSQL document database |
| **Mongoose** | Object Document Mapper (ODM): schemas, queries, relationships, and hooks |

### Authentication & Sessions
| Technology | Purpose |
|---|---|
| **Passport.js** | Authentication middleware (local username/password strategy) |
| **passport-local-mongoose** | Password hashing/salting and auth helper methods on the User model |
| **express-session** | Session management |
| **connect-mongo** | Stores sessions in MongoDB instead of server memory |
| **connect-flash** | One-time flash messages across redirects |

### Frontend
| Technology | Purpose |
|---|---|
| **EJS** | Server-side HTML templating |
| **ejs-mate** | Layout/partial support for EJS |
| **Bootstrap** | UI components and responsive grid |
| **Vanilla JavaScript** | Client-side interactivity (no framework) |

### Third-Party Services
| Technology | Purpose |
|---|---|
| **Cloudinary** | Cloud image storage and on-the-fly image resizing |
| **Multer** + **multer-storage-cloudinary** | Parses `multipart/form-data` uploads and streams them to Cloudinary |
| **Mapbox** | Forward geocoding (address → coordinates) and interactive maps |

### Validation & Utilities
| Technology | Purpose |
|---|---|
| **Joi** | Schema-based validation of incoming request bodies |
| **dotenv** | Loads environment variables from a `.env` file |
| **method-override** | Lets HTML forms issue PUT and DELETE requests |

---

## Prerequisites

Before running this project you will need:

1. **Node.js** — version 16 or higher ([download](https://nodejs.org/)). Verify with `node -v`.
2. **npm** — bundled with Node.js. Verify with `npm -v`.
3. **A MongoDB database** — either:
   - A free **MongoDB Atlas** cluster ([sign up](https://www.mongodb.com/cloud/atlas)), or
   - A **local MongoDB** installation running on `mongodb://127.0.0.1:27017`
4. **A Cloudinary account** (free tier is sufficient) — [sign up](https://cloudinary.com/) to obtain a cloud name, API key, and API secret. Required for image uploads.
5. **A Mapbox account** (free tier is sufficient) — [sign up](https://www.mapbox.com/) to obtain a public access token. Required for geocoding and maps.
6. **A `.env` file** in the project root containing your credentials. Copy `.env.example` and fill in your own values:

   ```
   ATLASDB_URL=mongodb+srv://<username>:<password>@<cluster-url>/RitishMajorProject
   SECRET=<a-long-random-session-secret>
   CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUD_API_KEY=<your-cloudinary-api-key>
   CLOUD_API_SECRET=<your-cloudinary-api-secret>
   MAP_TOKEN=<your-mapbox-access-token>
   ```

> **Note:** The application will not start without a valid `ATLASDB_URL` and `SECRET`. Image uploads and maps will fail without valid Cloudinary and Mapbox credentials.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file (copy the template and fill in your credentials)
cp .env.example .env

# 3. (Optional) Seed the database with sample listings
node init/index.js

# 4. Start the server
node app.js
```

Then open **http://localhost:8080** in your browser.

For detailed, step-by-step setup instructions — including how to obtain each API credential and how to troubleshoot common errors — see [`Run_Instructions.md`](./Run_Instructions.md).

---

## Project Structure

```
AirBnB-Clone-By-Ritish-Kapahi/
├── app.js                 # Entry point: config, DB connection, route mounting, error handling
├── middleware.js          # Reusable validation / auth / ownership middleware
├── schema.js              # Joi validation schemas for request bodies
├── cloudConfig.js         # Cloudinary + Multer storage configuration
├── controllers/           # Route logic and all database calls
├── models/                # Mongoose schemas (Listing, Review, User)
├── routers/               # Express routers mapping URLs to controllers
├── views/                 # EJS templates (layouts, includes, pages)
├── public/                # Static assets served to the browser (CSS, JS, images)
├── utils/                 # Helpers (wrapAsync, ExpressError)
└── init/                  # One-off database seeding script and sample data
```

A full explanation of every folder and file, plus how they interconnect, is in [`Master_Doc.md`](./Master_Doc.md).

---

## Documentation

This project ships with four documentation files:

| File | Contents |
|---|---|
| **README.md** | This file — project overview, features, tech stack, prerequisites |
| **[Master_Doc.md](./Master_Doc.md)** | Complete architecture reference: every folder and file explained, file interconnections, request lifecycle, and where every database call happens |
| **[Interview_QnA.md](./Interview_QnA.md)** | Technical interview questions and answers covering the code logic, architecture, database design, and security decisions in this project |
| **[Run_Instructions.md](./Run_Instructions.md)** | Detailed setup and execution guide, including obtaining API keys and troubleshooting |

---

## Author

**Ritish Kapahi**

Built September 2026.

---

## Acknowledgements

Built as a full-stack learning project to work hands-on with the Express/MongoDB stack, session-based authentication, third-party service integration (Cloudinary, Mapbox), and MVC architecture.
