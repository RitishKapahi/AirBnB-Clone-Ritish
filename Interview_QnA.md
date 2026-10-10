# Interview Questions & Answers
## AirBnB Clone By Ritish Kapahi

**Author:** Ritish Kapahi
**Created:** September 2026

A preparation guide for defending this project in a technical interview. Questions are grouped by theme, with answers written the way you would actually say them out loud.

> **General advice before you start:** interviewers respect candidates who know the *limitations* of their own code. Several answers below include honest caveats. Use them. Saying "here's what I'd fix and why" is a much stronger signal than pretending the project is flawless.

---

## Table of Contents

1. [Project Overview & Motivation](#1-project-overview--motivation)
2. [Architecture & Design](#2-architecture--design)
3. [Express & Routing](#3-express--routing)
4. [MongoDB & Mongoose](#4-mongodb--mongoose)
5. [Authentication & Security](#5-authentication--security)
6. [Middleware](#6-middleware)
7. [Error Handling](#7-error-handling)
8. [Third-Party Integrations](#8-third-party-integrations)
9. [Search, Filtering & Frontend](#9-search-filtering--frontend)
10. [Bugs You Found and Fixed](#10-bugs-you-found-and-fixed)
11. [Limitations & Future Improvements](#11-limitations--future-improvements)
12. [Rapid-Fire Questions](#12-rapid-fire-questions)

---

## 1. Project Overview & Motivation

### Q1.1 — Walk me through your project in two minutes.

It's a full-stack property rental application modeled on Airbnb, built on Node.js, Express, MongoDB, and EJS. It's server-rendered rather than a SPA, following an MVC architecture.

The core feature set: users sign up and log in with session-based authentication; they can create property listings with photo uploads and map locations; they can browse, search, and filter listings; they can leave star-rated reviews; and they have a personal dashboard to manage everything they've created.

Technically, the pieces I'd highlight are: Passport.js with hashed passwords for auth, Cloudinary for image storage so files aren't tied to the server's filesystem, Mapbox for converting user-entered addresses into map coordinates, Joi for request validation, and Mongoose schema hooks that cascade-delete reviews when their parent listing is removed so the database doesn't accumulate orphaned records.

The structure separates concerns into models, views, controllers, routers, and a middleware layer that handles validation and authorization before any request reaches business logic.

### Q1.2 — Why did you build this?

I wanted a project that would force me to work through the full lifecycle of a real web application rather than just CRUD. A rental marketplace was a good target because it naturally requires relationships between multiple data models, file uploads, third-party API integration, authentication, and authorization rules where users can only modify their own data. Those are the problems you actually hit in production work.

### Q1.3 — What was the hardest part?

Getting deletion right. It sounds trivial until you have related data. When a listing is deleted, its reviews have to go too — but a review is referenced in two places: it's a document in the reviews collection, and its ObjectId sits inside the parent listing's `reviews` array. Delete only one side and you end up with either orphaned documents or dangling references.

It got more complex because single deletes and bulk deletes need different handling in Mongoose. For a single delete I could use a `post("findOneAndDelete")` hook, since Mongoose passes the deleted document in and I can read its reviews array. But `deleteMany` doesn't give you the deleted documents, so for bulk deletion I had to use a `pre` hook that looks up the matching listings *before* they're removed, collects all their review IDs, and deletes those.

Working that out taught me a lot about the difference between application-level and database-level integrity — relational databases would give you `ON DELETE CASCADE` for free, but MongoDB doesn't have foreign keys, so this is your responsibility.

---

## 2. Architecture & Design

### Q2.1 — Explain your project structure.

It follows MVC with two additions — a routing layer and a middleware layer:

- **`models/`** — Mongoose schemas defining document structure and relationships (Listing, Review, User).
- **`views/`** — EJS templates, organized into a master layout, reusable includes, and page templates.
- **`controllers/`** — the actual route logic. This is where essentially all database calls live.
- **`routers/`** — map URLs and HTTP verbs to controller functions and declare which middleware runs first.
- **`middleware.js`** — reusable gatekeeping: validation, authentication, ownership checks.
- **`utils/`** — helpers: an async error wrapper and a custom error class.
- **`app.js`** — the entry point that wires everything together.

The value of this is isolation. If I need to change how listings are created, I touch one controller function. The router, model, and view are unaffected.

### Q2.2 — Why separate routers from controllers? Isn't that extra indirection?

It separates two distinct concerns: *what URL maps to what*, versus *what actually happens*. A router file is a readable table of contents — you can scan `routers/listing.js` and immediately see every listing endpoint, what HTTP verb it takes, and which guards protect it, without wading through business logic.

It also keeps controllers testable in isolation, since a controller function is just a function taking `(req, res, next)` — it doesn't know or care what URL invoked it.

### Q2.3 — Why server-side rendering instead of React?

For this application SSR was the better fit. The content is largely static per request, SEO matters for a listings marketplace, and there's no complex client-side state to manage. Server-rendering means the browser gets usable HTML immediately without waiting for a JS bundle to download and hydrate.

I used vanilla JavaScript for the interactive pieces that genuinely needed it — the map, filter toggles, image previews, tab switching. That kept the stack simpler with no build step.

If I were adding features like real-time booking availability, live chat, or complex multi-step forms with heavy client state, I'd reconsider and move to React or a hybrid framework like Next.js.

---

## 3. Express & Routing

### Q3.1 — What is middleware in Express?

A middleware function is any function with access to the request object, the response object, and a `next` function. They execute in the order they're registered, forming a pipeline. Each one can modify the request or response, end the request-response cycle, or call `next()` to pass control onward.

In my project: `express.urlencoded` parses form bodies, `session` attaches session data, Passport populates `req.user`, my custom `isLoggedIn` blocks unauthenticated requests, and `validateListing` rejects malformed input — all before the controller runs.

### Q3.2 — Why does route order matter in your listing router?

Express matches routes in the order they're registered, and returns on the first match. My router declares `/listings/search`, `/listings/new`, `/listings/filter/:id`, and `/listings/filterbtn` *before* `/listings/:id`.

If `/listings/:id` came first, a request to `/listings/new` would match it with `id = "new"`. The controller would then try `Listing.findById("new")`, which fails as an invalid ObjectId. Specific routes must always be registered before parameterized ones.

### Q3.3 — What is `mergeParams` and why did you need it?

My review router is mounted at `/listings/:id/reviews`, so the `:id` parameter belongs to the parent mount path, not to the router itself. By default each Express router has its own isolated `params` object and won't see parent parameters — `req.params.id` would be `undefined`.

Setting `express.Router({ mergeParams: true })` merges the parent's params into the child router, so I can read the listing ID inside my review routes.

### Q3.4 — How do you send DELETE and PUT requests from an HTML form?

HTML forms only support GET and POST. I use the `method-override` package: the form posts to a URL with a query string like `?_method=DELETE`, and the middleware reads that parameter and rewrites the request method before routing. That lets me write genuinely RESTful routes while still using plain HTML forms.

### Q3.5 — What does `express.static` do?

It serves files directly from a directory without any route handler. I point it at `public/`, so a request for `/css/style.css` returns `public/css/style.css`. It's how the browser gets stylesheets, client-side scripts, and images.

---

## 4. MongoDB & Mongoose

### Q4.1 — What's the difference between MongoDB and Mongoose?

MongoDB is the database. Mongoose is an ODM — Object Document Mapper — that sits on top of the MongoDB driver.

MongoDB itself is schemaless, so any document can have any shape. Mongoose adds a schema layer: type definitions, required fields, validation rules, defaults. It also gives you a cleaner query API, population for resolving references, and middleware hooks that fire on lifecycle events like save or delete.

### Q4.2 — Explain your data model and relationships.

Three collections:

- **User** — email, first/last name, profile image, plus username/hash/salt added by `passport-local-mongoose`.
- **Listing** — title, description, image, price, location, country, category array, GeoJSON geometry, an `owner` reference to a User, and a `reviews` array of Review references.
- **Review** — comment, rating, createdAt, an `author` reference to a User, and a `listing` back-reference.

A User owns many Listings and authors many Reviews. A Listing has many Reviews.

### Q4.3 — Why reference reviews instead of embedding them in the listing?

The main reason is query access patterns. My profile dashboard shows "all reviews written by this user." If reviews were embedded inside listing documents, answering that would require scanning every listing in the database and filtering nested arrays. With a separate collection it's a single indexed query on `author`.

Referencing also avoids MongoDB's 16MB document size limit — a very popular listing with thousands of reviews could approach that.

The trade-off is real though: reading a listing with its reviews requires `.populate()`, which is extra work, and deletes need cleanup in two places. If reviews were small, bounded, and only ever read alongside their listing, embedding would be faster.

### Q4.4 — What does `.populate()` do?

It replaces stored ObjectId references with the actual documents they point to. In my show controller:

```js
Listing.findById(id)
  .populate({ path: "reviews", populate: { path: "author" } })
  .populate("owner");
```

The nested populate goes two levels deep — it fetches the listing's reviews, and for each review, fetches its author. Without it I'd have raw ObjectIds and the view couldn't display reviewer names.

Worth knowing: populate isn't a SQL JOIN. Mongoose issues additional queries behind the scenes, so deep population on large result sets can become a performance problem.

### Q4.5 — Explain your cascade-delete hooks.

Two hooks in `models/listing.js`.

For single deletes, a `post("findOneAndDelete")` hook. It fires after the listing is removed, receives the deleted document, and deletes all reviews whose IDs were in that listing's `reviews` array.

For bulk deletes, a `pre("deleteMany")` hook. This one *has* to be `pre`, because `deleteMany` doesn't return the deleted documents — by the time a post hook ran, the listings would be gone and I'd have no way to know which reviews belonged to them. So the pre hook looks up the matching listings using the query filter, flattens all their review IDs, and deletes those reviews first.

### Q4.6 — What's the difference between `Date.now` and `Date.now()` in a schema default?

This was an actual bug I found and fixed. `Date.now()` with parentheses *calls* the function immediately, at the moment the schema is compiled — which is once, when the server starts. That value gets baked in as a constant, so every review ever created gets the same timestamp: whenever the server happened to boot.

`Date.now` without parentheses passes the function *reference*. Mongoose then invokes it fresh for each new document, giving each review its real creation time. The fix was removing two characters, but the symptom — every review showing an identical date — would have been confusing to debug without understanding the distinction.

### Q4.7 — What does `{ new: true }` do in `findByIdAndUpdate`?

By default Mongoose returns the document as it existed *before* the update. Passing `{ new: true }` returns the updated version instead. I need that in `updateListing` because after updating I set the geometry and possibly the image on the returned document, then save it — so I need the current state, not the stale one.

### Q4.8 — Why did you store both `url` and `filename` for images?

The `url` is the Cloudinary link used to display the image. The `filename` is Cloudinary's `public_id`, which is what their API requires to *delete* an image. Without storing the public ID, I'd have no way to clean up images when a listing is deleted — they'd accumulate in cloud storage forever, costing money and eventually hitting quota.

---

## 5. Authentication & Security

### Q5.1 — How does authentication work in your app?

Session-based authentication via Passport.js with the local strategy.

On signup, `User.register()` from `passport-local-mongoose` generates a random salt, hashes the password with PBKDF2, and stores the hash and salt — never the plaintext password.

On login, Passport looks up the user by username, hashes the submitted password with that user's stored salt, and compares against the stored hash. On success it creates a session; `serializeUser` stores only the user's ID in it.

On every subsequent request, `deserializeUser` reads that ID and fetches the full user document into `req.user`. My global middleware then copies it to `res.locals.currUser` so every view can check login state.

Sessions are stored in MongoDB via `connect-mongo`, not in server memory.

### Q5.2 — Why store sessions in MongoDB instead of memory?

Three reasons. First, in-memory sessions are lost on every server restart or deploy, logging everyone out. Second, they don't scale horizontally — with multiple server instances behind a load balancer, a user's session on instance A is invisible to instance B. Third, memory usage grows unbounded with active sessions.

A MongoDB-backed store solves all three. It's also why `express-session` prints a warning about the default MemoryStore not being production-ready.

### Q5.3 — What is salting and why does it matter?

A salt is a random value generated per user and combined with their password before hashing.

Without salting, identical passwords produce identical hashes. An attacker who obtains the database can use a precomputed rainbow table to reverse common passwords instantly, and can immediately see which users share a password.

With a unique per-user salt, the same password produces completely different hashes for different users. Rainbow tables become useless because the attacker would need a separate table per salt. `passport-local-mongoose` handles this automatically.

### Q5.4 — What's the difference between authentication and authorization in your app?

Authentication is "who are you" — handled by `isLoggedIn`, which checks whether a valid session exists.

Authorization is "are you allowed to do this to *this specific* resource" — handled by `isOwner`, `isReviewAuthor`, `isProfileOwner`, and so on. These fetch the resource and compare its owner/author field against the current user's ID.

Both are required. Authentication alone would mean any logged-in user could delete any listing just by sending a DELETE request to its URL. That's a classic broken-access-control vulnerability — it's in the OWASP Top 10.

### Q5.5 — Why is the session cookie `httpOnly`?

`httpOnly` prevents browser JavaScript from reading the cookie via `document.cookie`. If an attacker manages to inject a script through an XSS vulnerability, they still can't steal the session ID and impersonate the user. It doesn't prevent XSS, but it limits the damage.

### Q5.6 — How do you validate user input?

Two layers. Client-side, HTML5 constraints plus Bootstrap validation styling give immediate feedback. Server-side, Joi schemas in `schema.js` validate every write request body before it reaches a controller.

The server-side layer is the one that actually matters. Client-side validation is purely UX — anyone can bypass it with curl or DevTools. You should never trust input that has only been validated in the browser.

### Q5.7 — What's the difference between your Joi schemas and your Mongoose schemas?

They operate at different layers. Joi validates the *HTTP request body* — the shape of incoming data at the application boundary, before anything touches the database. Mongoose validates the *document* — the shape of data as it's persisted.

Joi catches a malformed form submission early with a clear message. Mongoose enforces structural integrity at the data layer regardless of where the write came from. Having both means bad data is caught at the edge and the database is still protected if something bypasses the edge.

### Q5.8 — What security weaknesses does your app still have?

Being honest about this list:

- **No rate limiting.** The login endpoint can be brute-forced. I'd add `express-rate-limit`.
- **No CSRF protection.** State-changing forms could be submitted from another origin. I'd add `csurf` or SameSite cookie enforcement.
- **No `helmet`.** Standard security headers (CSP, X-Frame-Options, HSTS) aren't set.
- **No server-side file size limit.** The 100KB image check is client-side only, so a crafted request could upload something much larger.
- **No NoSQL injection sanitization.** My search uses `$regex` with user input — I'd add `express-mongo-sanitize` and escape regex metacharacters.
- **The `hide.js` script is theater.** Disabling right-click and F12 provides no real protection and is trivially bypassed. I'd remove it rather than let it imply security that isn't there.

### Q5.9 — How do you keep secrets out of version control?

All credentials live in a `.env` file loaded by `dotenv`, and `.env` is listed in `.gitignore` so it's never committed. I include a `.env.example` showing which variables are needed with placeholder values, so anyone cloning the repo knows what to configure without exposing real keys.

In production the platform injects environment variables directly, which is why `app.js` only calls `dotenv.config()` when `NODE_ENV` isn't production.

---

## 6. Middleware

### Q6.1 — Walk me through what happens when someone submits the "create listing" form.

The request hits `POST /listings` and passes through the pipeline:

1. `express.urlencoded` and session middleware run; Passport populates `req.user`.
2. `isLoggedIn` checks authentication. Not logged in → save the attempted URL, flash an error, redirect to login.
3. `upload.single("listing[image]")` — Multer parses the multipart body and streams the file to Cloudinary, populating `req.file`.
4. `validateListing` runs the body through Joi. Invalid → throw a 400.
5. The controller calls Mapbox to geocode the location. No result → flash and redirect.
6. It builds the document, attaches owner, image, and geometry, and saves to MongoDB.
7. Flash success and redirect to the listings index.

### Q6.2 — Why does `validateUser` redirect while `validateListing` throws?

Different user experiences. A failed listing validation is unusual — the form has client-side validation, so reaching the server invalid suggests something odd. Throwing a 400 surfaces it on the error page.

A failed signup is a normal, expected event — a taken username, a weak password. Rendering a full error page for that would be hostile. So `validateUser` flashes the specific message and redirects back to the form, where the user can correct it in context.

### Q6.3 — How does "redirect back to where I was" work after login?

Two middleware functions cooperate. When `isLoggedIn` blocks an unauthenticated request, it first stores `req.originalUrl` in `req.session.redirectUrl`. After the user logs in, `saveRedirectUrl` copies that value from the session into `res.locals.redirectUrl`, and the login controller redirects there, falling back to `/listings` if nothing was saved.

The reason it moves through `res.locals` is that Passport regenerates the session on login, so the value has to be read out before that happens.

---

## 7. Error Handling

### Q7.1 — Explain your error handling strategy.

Centralized. Every error, wherever it originates, funnels into one error-handling middleware registered last in `app.js`:

```js
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("listings/error.ejs", { message });
});
```

Errors reach it three ways: synchronous throws in middleware (Express catches these automatically), async rejections in controllers (caught by my `wrapAsync` wrapper), and unmatched routes (the `app.all("*")` catch-all creates a 404 `ExpressError`).

### Q7.2 — What is `wrapAsync` and why do you need it?

```js
module.exports = (fn) => (req, res, next) => fn(req, res, next).catch(next);
```

Express 4 doesn't catch rejected promises from async route handlers. If a database call fails inside an async controller, you get an unhandled rejection and the request hangs until timeout.

The alternative is a try/catch in every controller, which is repetitive. `wrapAsync` takes a handler, returns a function with the same signature, and attaches `.catch(next)` — so any rejection is automatically forwarded to the error handler.

Express 5 handles this natively, which would make the wrapper unnecessary.

### Q7.3 — Why does your error handler have four parameters?

Express identifies error-handling middleware by arity. A function with four parameters `(err, req, res, next)` is registered as an error handler; three parameters makes it ordinary middleware. Drop the unused `next` and errors would silently stop being caught.

### Q7.4 — Why does the error handler have to be registered last?

Middleware executes in registration order. The error handler must come after all routes so that errors thrown anywhere upstream can propagate down to it. Registered early, it would never see errors from routes defined below it.

### Q7.5 — Why did you create a custom `ExpressError` class?

A plain `Error` carries only a message, so everything would return 500. My subclass adds a `statusCode`:

```js
class ExpressError extends Error {
  constructor(statusCode, message) {
    super();
    this.statusCode = statusCode;
    this.message = message;
  }
}
```

That lets the handler send semantically correct status codes — 404 for a missing page, 400 for validation failure — which matters both for users and for anything consuming the app programmatically.

---

## 8. Third-Party Integrations

### Q8.1 — How does image upload work end to end?

The form submits as `multipart/form-data`. Multer intercepts it, and because I've configured `multer-storage-cloudinary` as the storage engine, the file streams directly to Cloudinary rather than being written to local disk. Cloudinary returns a URL and a public ID, which Multer exposes as `req.file.path` and `req.file.filename`. The controller stores both on the document.

### Q8.2 — Why Cloudinary instead of saving to the server?

Ephemeral filesystems. Platforms like Vercel, Render, and Heroku wipe the filesystem on every deploy and container restart — locally-saved uploads would silently disappear. It also doesn't work with multiple server instances, since a file saved on one instance isn't visible to another.

Cloudinary also gives me CDN delivery and on-the-fly transformations, which I use for the edit-form thumbnail: I insert `/upload/w_200,h_150` into the URL and Cloudinary generates and caches a resized version. No server-side image processing at all.

### Q8.3 — Explain geocoding in your app.

When a listing is created or updated, I send the location and country text to Mapbox's forward geocoding API, which returns GeoJSON coordinates. Those get stored in `listing.geometry` as a Point. On the show page, the template passes the coordinates and the Mapbox token to client-side JS, which renders an interactive map with a marker.

Important detail: Mapbox legitimately returns an empty features array for nonsensical input. The original code read `features[0].geometry` directly, which threw a TypeError on an empty array and crashed listing creation. I extracted a `geocodeLocation` helper that returns `null` when there are no results, and the controller then flashes a friendly message asking the user to check the location.

### Q8.4 — Why store coordinates as GeoJSON rather than two number fields?

GeoJSON is the format MongoDB requires for geospatial indexes and queries. Storing it this way means I can add `2dsphere`-indexed features later — "listings within 50km of me," sorting by distance — without migrating the data. It's also the format Mapbox returns and consumes, so no conversion is needed.

---

## 9. Search, Filtering & Frontend

### Q9.1 — How does your search work?

It's a cascading strategy. The query is normalized — trimmed, internal whitespace collapsed, converted to title case — then matched against fields in sequence using case-insensitive regex: title, then category, then country, then location. If the query parses as an integer, it finally tries price as an upper bound. It returns as soon as one field produces results; if all miss, it flashes a "not found" message.

I'd be upfront that this is a simple approach. It fires up to five sequential queries, it can't match across fields simultaneously, unanchored `$regex` can't use an index efficiently, and there's no relevance ranking. For production I'd use a MongoDB text index with `$text` search, or Atlas Search for fuzzy matching and scoring.

### Q9.2 — How does the category filter persist across page loads?

`localStorage`. When a filter is clicked, the category name is stored, and on page load the stored value is read back and the matching button gets a highlight class. It's purely cosmetic state, so `localStorage` is appropriate — nothing sensitive, and it doesn't need to reach the server.

### Q9.3 — What does `ejs-mate` do?

It adds layout support to EJS. Without it every template would need its own full HTML document — doctype, head, script tags, navbar, footer — duplicated everywhere. With `ejs-mate` I define one `boilerplate.ejs` containing all of that, and each page declares `<% layout("/layouts/boilerplate") %>`; its content gets injected into the layout's body.

### Q9.4 — How do you prevent double form submissions?

In `script.js`, when a form passes validation I disable the submit button, change its label to "Loading..", show a spinner, and dim the page. The button stays disabled until the response arrives and the page navigates away.

That said, it's a client-side guard only. A real safeguard against duplicate writes would need server-side idempotency — a unique constraint or a request token. My `title` field being unique does provide accidental protection against duplicate listings.

### Q9.5 — Is the like button functional?

No, and I'd say so directly. It toggles a CSS class and increments a number in the DOM — nothing is persisted, so a refresh resets it. It's a UI placeholder.

Making it real would need a `favorites` array on the User model or a separate join collection, a POST route to toggle it, and a fetch call from the client so it doesn't require a page reload. It's on my list of things to build next.

---

## 10. Bugs You Found and Fixed

> This section is worth rehearsing. Interviewers love hearing about debugging, and being able to explain a subtle bug clearly demonstrates real understanding.

### Q10.1 — Tell me about a bug you found and fixed.

The one I'd lead with is the "Cannot set headers after they are sent" crash.

Several controllers had this shape:

```js
if (!listing) {
  req.flash("error", "Listing does not exist!");
  res.redirect("/listings");   // no return
}
res.render("listings/show.ejs", { listing });
```

`res.redirect()` doesn't stop function execution — it just writes a response. Without `return`, the code kept going and called `res.render()` on an already-sent response, which throws `ERR_HTTP_HEADERS_SENT` and crashes the request.

What made it interesting is that it only triggered on the edge case — a deleted or invalid listing ID. The happy path worked perfectly, so it was invisible in normal testing. The fix was adding `return` before every redirect, which I applied across `showListing`, `renderEditForm`, and `search`.

### Q10.2 — What other bugs did you fix?

Several, of varying subtlety:

**Frozen review timestamps.** The Review schema had `default: Date.now()` instead of `default: Date.now`. The parentheses meant the function was called once at schema-compile time, so every review got the same timestamp — whenever the server had started.

**A disabled security control from a typo.** The Cloudinary config had `allowerdFormats` instead of `allowedFormats`. Because it was misspelled, the library silently ignored the option and the image-type allowlist wasn't enforced at all — any file type could be uploaded. A silent-failure bug: no error, just a security control that quietly did nothing.

**Null-check ordering.** `renderEditForm` read `listing.image.url` before checking whether `listing` was null, so an invalid ID threw a TypeError instead of redirecting gracefully.

**Variable shadowing in search.** One branch declared `let allListing = ...` inside an `if` block, shadowing the outer variable. The outer one stayed empty regardless of what that query found, silently breaking the fall-through logic for subsequent checks.

**Zombie sessions after account deletion.** The user document was deleted but `req.logout()` was never called, so the session still referenced a nonexistent user ID. The next request's `deserializeUser` lookup would fail, leaving the app half-authenticated.

**Orphaned Cloudinary images.** Deleting a listing removed the database record but left the image in cloud storage forever, accumulating cost.

**A privacy problem in logging.** A debug middleware was logging every visitor's IP address, forwarded headers, and full raw headers on every single request. Removed.

**Session cookie expiry.** The cookie used a static `expires: Date.now() + 7 days`, evaluated once at boot — so all sessions expired on the same calendar date regardless of when they were created. Switched to `maxAge`, which express-session computes per session.

### Q10.3 — How would you have caught these earlier?

Automated tests, primarily. Integration tests hitting each route with both valid and invalid IDs would have caught every missing-`return` bug immediately. A unit test asserting that two reviews created moments apart have different timestamps would have caught the `Date.now()` issue.

Beyond tests: a linter with `no-shadow` enabled would have flagged the variable shadowing, and TypeScript would have caught the null-check ordering at compile time. Adding a test suite is the single highest-value improvement I'd make to this project.

---

## 11. Limitations & Future Improvements

### Q11.1 — What would you improve if you kept working on this?

In priority order:

1. **Automated tests.** There are none. I'd add Jest and Supertest for route integration tests, covering auth flows and ownership rules especially.
2. **Actual booking functionality.** Right now listings can't be booked. This is the biggest functional gap — it'd need a Booking model, date-range availability checking, and conflict detection.
3. **Pagination.** `Listing.find()` returns every listing. At scale that's unbounded memory and a slow page. I'd add limit/skip or cursor-based pagination.
4. **Better search.** Replace the cascading regex approach with a MongoDB text index or Atlas Search.
5. **Security hardening.** Rate limiting, CSRF tokens, `helmet`, input sanitization, server-side file size limits.
6. **Fix the N+1 bulk delete.** `allReviewDestroy` loops with two queries per review. I'd batch it into one `bulkWrite` and one `deleteMany`.
7. **Structured logging.** Replace `console.log` with Winston or Pino, with log levels and no PII.
8. **Database indexes.** Add indexes on `owner`, `author`, and `category` — the fields I query most.

### Q11.2 — How would you scale this to a million listings?

Several layers:

- **Indexes first.** Compound indexes on the common query patterns, and a `2dsphere` index on geometry for location search. Without them every query is a collection scan.
- **Pagination everywhere**, cursor-based rather than skip-based, since `skip` degrades badly at high offsets.
- **Caching.** Redis in front of hot reads — popular listings, category counts.
- **Move search out of MongoDB.** Elasticsearch or Atlas Search for real full-text relevance.
- **Horizontal scaling.** The app is already stateless apart from sessions, and those are in MongoDB, so I can run multiple instances behind a load balancer.
- **Sharding** on a sensible key like region if a single replica set became the bottleneck.

### Q11.3 — What's the biggest weakness of this project?

The absence of tests. Everything else is a feature gap I could scope and build; no test suite is a structural problem. It means every refactor is risky, regressions are invisible until a user hits them, and the bugs I described earlier could only be found by manual inspection. If I were continuing, that's where I'd start.

### Q11.4 — What would you architect differently from scratch?

Three things. I'd add TypeScript from day one — most of the bugs I found were type-level mistakes a compiler would have caught. I'd introduce a service layer between controllers and models, so business logic isn't coupled to HTTP concerns and becomes trivially unit-testable. And I'd write tests alongside features rather than planning to add them later.

---

## 12. Rapid-Fire Questions

**What is `next()`?** Passes control to the next middleware in the pipeline. Calling `next(err)` skips ahead to the error handler.

**What's `req.params` vs `req.query` vs `req.body`?** `params` is route segments (`/listings/:id`), `query` is the query string (`?q=beach`), `body` is the request payload from a form or JSON.

**What does `res.locals` do?** Holds variables available to templates rendered in that request. I use it for flash messages and the current user so every view can access them.

**Why `saveUninitialized: false` vs `true`?** `false` avoids storing sessions for visitors who never log in, saving storage and helping with cookie-consent compliance. Mine is `true`, which is the less efficient choice.

**What is `touchAfter`?** A `connect-mongo` option that avoids rewriting an unchanged session to the database more than once per interval — 24 hours in my config. Without it every request would issue a session write.

**What is `$pull`?** A MongoDB update operator that removes matching values from an array. I use it to detach a review ID from a listing's `reviews` array.

**What is `$in`?** Matches any document whose field value appears in a given array. My cascade hook uses `{_id: {$in: reviewIds}}` to delete many reviews in one call.

**What is `$all`?** Matches arrays containing all specified elements. My category filter uses it.

**What's the difference between `find` and `findOne`?** `find` returns an array of all matches; `findOne` returns a single document or null.

**Why `.sort({_id: -1})`?** MongoDB ObjectIds embed a creation timestamp, so sorting by `_id` descending gives newest-first without needing a separate date field.

**What is `dotenv`?** Loads variables from a `.env` file into `process.env`, keeping secrets out of source code.

**What is flash?** One-time messages stored in the session and cleared once read — used for "Listing Created!" style feedback that survives a redirect.

**Why does login use POST, not GET?** GET requests put parameters in the URL, where they'd be logged in server logs and browser history. Credentials belong in the request body.

**What is `wrapAsync` in one sentence?** A wrapper that forwards rejected promises from async route handlers to Express's error handler, replacing per-controller try/catch.

**What HTTP status does a successful redirect return?** 302 by default in Express.

**What's the difference between PUT and PATCH?** PUT replaces the whole resource; PATCH applies a partial update. I use PUT since my edit form submits all fields.

---

## Closing Advice

Three things to remember when defending this project:

**Know your database calls.** The most common deep-dive question is "walk me through what happens when a user does X." Be able to trace the full path — router, middleware, controller, model, database, view — for at least listing creation and listing deletion.

**Lead with the bugs.** Section 10 is your strongest material. Anyone can build CRUD; being able to explain *why* `Date.now()` froze every timestamp, or why a missing `return` after a redirect crashes the request, shows you understand what the code actually does rather than just that it works.

**Own the limitations.** Don't oversell. Saying "the like button is UI-only, the search wouldn't scale, and there are no tests — here's how I'd fix each" reads as engineering maturity. Claiming it's production-ready and then being caught out by a follow-up question does not.
