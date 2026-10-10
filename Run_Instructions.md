# Run Instructions
## AirBnB Clone By Ritish Kapahi

**Author:** Ritish Kapahi
**Created:** September 2026
**Database:** `RitishMajorProject` (MongoDB)

A complete, step-by-step guide to setting up and running this project from scratch.

---

## Table of Contents

1. [Prerequisites](#step-0--prerequisites)
2. [Get the Project Files](#step-1--get-the-project-files)
3. [Install Dependencies](#step-2--install-dependencies)
4. [Set Up MongoDB](#step-3--set-up-mongodb)
5. [Set Up Cloudinary](#step-4--set-up-cloudinary)
6. [Set Up Mapbox](#step-5--set-up-mapbox)
7. [Create the `.env` File](#step-6--create-the-env-file)
8. [Seed the Database (Optional)](#step-7--seed-the-database-optional)
9. [Run the Application](#step-8--run-the-application)
10. [Verify Everything Works](#step-9--verify-everything-works)
11. [Troubleshooting](#troubleshooting)
12. [Development Tips](#development-tips)
13. [Deployment Notes](#deployment-notes)

---

## Step 0 — Prerequisites

Before starting you need the following installed and available.

### Node.js and npm

Node.js version 24.x is required for the current Vercel runtime. npm ships with it.

Check whether you already have them:

```bash
node -v
npm -v
```

Expected output is something like `v18.17.0` and `9.6.7`. If either command is not found, download and install Node.js from [nodejs.org](https://nodejs.org/) (the LTS version is recommended), then reopen your terminal and check again.

### Accounts you will need

This project depends on three external services. All three have free tiers that are sufficient:

| Service | Why it's needed | Sign up |
|---|---|---|
| **MongoDB** (Atlas or local) | Stores all application data | [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) |
| **Cloudinary** | Stores uploaded listing and profile images | [cloudinary.com](https://cloudinary.com/) |
| **Mapbox** | Geocoding addresses and rendering maps | [mapbox.com](https://www.mapbox.com/) |

Steps 3 through 5 walk through obtaining credentials for each.

### A code editor

Any editor works. VS Code is a common choice.

---

## Step 1 — Get the Project Files

If you received a `.zip`, extract it and open a terminal in the extracted folder.

If cloning from a repository:

```bash
git clone <repository-url>
cd AirBnB-Clone-By-Ritish-Kapahi
```

Confirm you are in the right directory — you should see `app.js`, `package.json`, and folders named `controllers`, `models`, `routers`, and `views`:

```bash
ls
```

---

## Step 2 — Install Dependencies

From the project root:

```bash
npm install
```

This reads `package.json` and downloads every dependency into a `node_modules/` folder. It typically takes 30–90 seconds depending on your connection.

You should see a summary like `added 180 packages in 45s`. Warnings about deprecated sub-dependencies are normal and can be ignored. Actual errors are not — see [Troubleshooting](#troubleshooting).

**What gets installed:** Express, Mongoose, Passport and `passport-local-mongoose`, `express-session`, `connect-mongo`, `connect-flash`, EJS and `ejs-mate`, Joi, Multer and `multer-storage-cloudinary`, the Cloudinary SDK, the Mapbox SDK, `method-override`, and `dotenv`.

---

## Step 3 — Set Up MongoDB

You have two options. **Atlas is recommended** — it's free, requires no local installation, and matches how the app is deployed.

### Option A — MongoDB Atlas (cloud, recommended)

1. **Create an account** at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign in.

2. **Create a free cluster.** Choose the free **M0** tier, pick a cloud provider and a region near you, and create it. Provisioning takes a few minutes.

3. **Create a database user.** Go to **Database Access** → **Add New Database User**. Choose password authentication, set a username and password, and grant **Read and write to any database**.
   > Save these credentials — you'll need them in Step 6. If your password contains special characters (`@`, `:`, `/`, `#`), they must be percent-encoded in the connection string, so a simple alphanumeric password is easier.

4. **Allow network access.** Go to **Network Access** → **Add IP Address**. For local development, **Allow Access from Anywhere** (`0.0.0.0/0`) is simplest. For a production deployment, restrict this to your server's IP.

5. **Get your connection string.** Go to **Database** → **Connect** → **Drivers**, and copy the string. It looks like:

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Adapt it for this project.** Replace `<username>` and `<password>` with your database user's credentials, and insert the database name `RitishMajorProject` before the `?`:

   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/RitishMajorProject?retryWrites=true&w=majority
   ```

   > The database name matters. Without it, MongoDB uses a default database and your data will land somewhere unexpected.

### Option B — Local MongoDB

1. Install MongoDB Community Server from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).

2. Start the service:
   - **macOS (Homebrew):** `brew services start mongodb-community`
   - **Windows:** it usually runs automatically as a service after install
   - **Linux:** `sudo systemctl start mongod`

3. Verify it's running:
   ```bash
   mongosh
   ```
   A connection prompt means it's working. Type `exit` to leave.

4. Your connection string is:
   ```
   mongodb://127.0.0.1:27017/RitishMajorProject
   ```

---

## Step 4 — Set Up Cloudinary

Cloudinary stores all uploaded images. Without valid credentials, creating a listing will fail at the upload step.

1. **Create a free account** at [cloudinary.com](https://cloudinary.com/) and sign in.

2. **Open your dashboard.** The landing page after login shows a **Product Environment Credentials** panel.

3. **Copy three values:**
   - **Cloud Name** — a short string, e.g. `dxyz123ab`
   - **API Key** — a long number, e.g. `123456789012345`
   - **API Secret** — click the eye icon to reveal it

   > Treat the API Secret like a password. Never commit it or share it publicly.

The app uploads everything into a folder named `RitishMajorProject_DEV`, which Cloudinary creates automatically on the first upload. Only `png`, `jpg`, and `jpeg` files are accepted.

---

## Step 5 — Set Up Mapbox

Mapbox converts location text into coordinates and renders the interactive map on each listing page.

1. **Create a free account** at [mapbox.com](https://www.mapbox.com/) and sign in.

2. **Find your access token.** Your dashboard shows a **Default public token** starting with `pk.`. Copy it, or create a new one under **Tokens** → **Create a token** (the default public scopes are sufficient).

3. The token looks like:
   ```
   pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsa...
   ```

> **Note:** this token is intentionally public — it gets embedded in the page so the browser can render the map. Mapbox lets you restrict it by URL in token settings, which is worth doing before any public deployment.

---

## Step 6 — Create the `.env` File

This file holds all your credentials and must live in the project root, alongside `app.js`.

A template is included. Copy it:

```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env
```

Open `.env` in your editor and fill in the values you gathered:

```
# MongoDB connection string from Step 3
ATLASDB_URL=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/RitishMajorProject?retryWrites=true&w=majority

# Any long random string — this signs your session cookies
SECRET=a-long-random-string-that-nobody-can-guess-12345

# Cloudinary credentials from Step 4
CLOUD_NAME=your-cloud-name
CLOUD_API_KEY=your-api-key
CLOUD_API_SECRET=your-api-secret

# Mapbox token from Step 5
MAP_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsa...
```

### Important notes

- **No quotes and no spaces around `=`.** Write `SECRET=mysecret`, not `SECRET = "mysecret"`.
- **The file must be named exactly `.env`** — not `.env.txt`. Windows may hide the extension; enable "show file extensions" to verify.
- **`SECRET` can be anything**, but longer and more random is better. Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Never commit `.env` to git.** It's already listed in `.gitignore`. Verify with `git status` — `.env` should not appear.

---

## Step 7 — Add Demo Listings (Optional)

The recommended seeder adds 49 varied demo listings without deleting or
overwriting existing data. It is safe to run more than once: exact duplicate
titles are skipped.

```bash
node scripts/seed-listings.js
```

The script assigns listings to the oldest existing user by default. To select
a specific owner, set one of these optional values in `.env`:

```env
SEED_OWNER_EMAIL=your-login-email
SEED_OWNER_ID=your-user-object-id
```

If the database has no users yet, create an account first. The older
`node init/index.js` script is a reset-style legacy tool that deletes existing
listings and should only be used with a disposable database.

### Configure the administrator panel

Set at least one administrator identity in `.env`, then restart the server:

```env
ADMIN_EMAIL=your-login-email
```

You can also use `ADMIN_USERNAME`, `ADMIN_USER_ID`, or comma-separated
`ADMIN_EMAILS` / `ADMIN_USERNAMES`. After signing in with the configured
account, open `/admin/listings` to search, edit, and delete any listing.

---

## Step 8 — Run the Application

From the project root:

```bash
node app.js
```

Expected output:

```
server is listening to port 8080
connected to DB
```

Both lines matter. `server is listening` means Express started; `connected to DB` means MongoDB is reachable. If you only see the first line and then an error, the database connection failed — check your `ATLASDB_URL`.

Now open your browser to:

**http://localhost:8080**

You should be redirected to the listings page.

To stop the server, press `Ctrl+C` in the terminal.

### Running with auto-restart (recommended for development)

Restarting manually after every change gets tedious. Install `nodemon` globally:

```bash
npm install -g nodemon
```

Then run:

```bash
nodemon app.js
```

The server now restarts automatically whenever you save a file.

---

## Step 9 — Verify Everything Works

Walk through this checklist to confirm each integration is functioning:

| # | Action | Confirms |
|---|---|---|
| 1 | Open `http://localhost:8080` | Server and database are running |
| 2 | Click **Sign Up** and create an account | User creation and password hashing work |
| 3 | Confirm you're logged in automatically after signup | Passport sessions work |
| 4 | Click **Log Out**, then log back in | Login flow works |
| 5 | Create a new listing with a real location (e.g. "Paris", "France") and a small image | **Cloudinary upload** and **Mapbox geocoding** both work |
| 6 | Open the listing you just created | Detail page renders |
| 7 | Confirm the map displays with a red marker | Mapbox client-side rendering works |
| 8 | Leave a review with a star rating | Review creation and the listing↔review relationship work |
| 9 | Search for part of your listing's title | Search works |
| 10 | Click a category filter button | Filtering works |
| 11 | Visit **Profile** | Dashboard queries work |
| 12 | Delete the listing | Deletion and review cascade-delete work |

If every step passes, the installation is complete and correct.

---

## Troubleshooting

### `Error: Cannot find module 'express'`

Dependencies were never installed, or the install failed. Run `npm install` from the project root. If it still fails, delete and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

### `MongooseServerSelectionError` / `connection timed out`

The app can't reach MongoDB. Work through these in order:

- **Atlas:** confirm your IP is whitelisted under **Network Access**. Try `0.0.0.0/0` temporarily to rule it out.
- **Atlas:** confirm the username and password in your connection string match a user under **Database Access** — not your Atlas login.
- **Special characters:** if your password contains `@`, `:`, `/`, or `#`, percent-encode them (`@` → `%40`). Simplest fix is to reset to an alphanumeric password.
- **Local:** confirm MongoDB is actually running (`mongosh` should connect).
- **Network:** some corporate or campus networks block the outbound port Atlas uses. Try a different network or mobile hotspot.

---

### `SECRET option required for sessions` / server crashes at startup

The `.env` file isn't being read. Check:

- It's named exactly `.env`, not `.env.txt` or `env`.
- It's in the project root, next to `app.js` — not inside a subfolder.
- There are no quotes or spaces around the `=` signs.
- You restarted the server after creating it (`.env` is read once at startup).

Verify it's loading:
```bash
node -e "require('dotenv').config(); console.log(process.env.SECRET ? 'SECRET loaded' : 'SECRET MISSING')"
```

---

### `Error: listen EADDRINUSE: address already in use :::8080`

Port 8080 is occupied — usually by a previous instance of this app that didn't shut down.

Find and kill it:

```bash
# macOS / Linux
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :8080
taskkill /PID <pid-number> /F
```

Set the `PORT` environment variable when you need a different port; the app
falls back to `8080` locally.

---

### Image upload fails or the listing won't save

Almost always Cloudinary credentials. Check:

- All three values (`CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`) are present in `.env` with no typos.
- The API Secret was fully revealed and copied (click the eye icon on the dashboard).
- The file is `png`, `jpg`, or `jpeg` — other formats are rejected.
- The file is under 100KB — there's a client-side size guard.

---

### The map doesn't appear on a listing page

- Confirm `MAP_TOKEN` is set in `.env` and starts with `pk.`.
- Open the browser console (F12) and look for Mapbox errors — a 401 means the token is invalid.
- Confirm the listing has valid geometry. If it was created when geocoding failed, it may have no coordinates.

> Note: this project includes `public/js/hide.js`, which disables F12 and right-click. To debug in the browser, open DevTools from the browser menu instead, or temporarily comment out that script tag in `views/layouts/boilerplate.ejs`.

---

### "We couldn't find that location" when creating a listing

Mapbox returned no results for your location text. Use a real, recognizable place name and a matching country — "Paris" + "France" works; "asdfgh" + "Narnia" won't. This is expected behavior, not a bug.

---

### Seeded listings appear broken or ownerless

Use `scripts/seed-listings.js`, create at least one user first, and set
`SEED_OWNER_EMAIL` or `SEED_OWNER_ID` when a specific owner is required.

---

### Changes to my code aren't showing up

- Restart the server (`Ctrl+C`, then `node app.js`) — Node doesn't hot-reload. Use `nodemon` to avoid this.
- For CSS/JS changes, hard-refresh the browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS).

---

## Development Tips

**Use nodemon.** `npm install -g nodemon` then `nodemon app.js`. Saves a lot of manual restarting.

**Inspect your data.** MongoDB Compass ([download](https://www.mongodb.com/products/compass)) gives you a GUI for browsing collections — connect with the same `ATLASDB_URL`. Very useful for confirming what actually got written.

**Read the code comments.** Every file has a header explaining its purpose and what it connects to, and database calls are marked inline.

**Understand the architecture first.** `Master_Doc.md` maps out every file and traces complete request flows. Reading it before making changes will save time.

**Reset your database.** To start clean, either drop the `RitishMajorProject` database from Atlas/Compass, or re-run `node init/index.js` (listings only).

---

## Deployment Notes

The project includes a `vercel.json` for Vercel deployment. Whatever platform you choose, the essentials are the same:

1. **Set environment variables in the platform's dashboard**, not in a `.env` file. The app skips `dotenv` when `NODE_ENV=production` and reads injected variables directly.

2. **Set `NODE_ENV=production`.**

3. **Whitelist your host's IP in Atlas** under Network Access, or allow `0.0.0.0/0` if the platform uses dynamic IPs.

4. **Restrict your Mapbox token by URL** in the Mapbox dashboard, so it can't be reused elsewhere.

5. **Port binding:** the application uses `process.env.PORT || 8080`, so it works locally and with platforms that inject a `PORT` variable.

6. **Before going public,** address the security items listed in `Interview_QnA.md` §5.8 — rate limiting, CSRF protection, `helmet`, and input sanitization are the main gaps.

---

## Quick Reference

```bash
npm install            # Install dependencies (once)
node scripts/seed-listings.js # Add demo listings (optional, non-destructive)
node app.js            # Start the server
nodemon app.js         # Start with auto-restart (dev)
```

**App URL:** http://localhost:8080
**Required env vars:** `ATLASDB_URL`, `SECRET`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `MAP_TOKEN`
**Optional admin vars:** `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_USER_ID`

---

## Further Documentation

| File | Contents |
|---|---|
| [README.md](./README.md) | Project overview, features, tech stack |
| [Master_Doc.md](./Master_Doc.md) | Full architecture: every file explained, request flows, database call reference |
| [Interview_QnA.md](./Interview_QnA.md) | Technical interview preparation |
