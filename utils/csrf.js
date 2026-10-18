/**
 * utils/csrf.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Protect state-changing requests with a session-backed CSRF token.
 *
 * DEPENDS ON / INTERACTS WITH:
 *   - express-session -> stores the per-session token.
 *   - views/layouts/boilerplate.ejs -> exposes the token to client JavaScript.
 *   - multipart routes -> validate after Multer has parsed the request body.
 * ---------------------------------------------------------------------------
 */

"use strict";

const crypto = require("crypto");
const ExpressError = require("./ExpressError.js");

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

const ensureCsrfToken = (req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    res.locals.csrfToken = req.session.csrfToken;
    next();
};

const tokenMatches = (expectedToken, receivedToken) => {
    if (
        typeof expectedToken !== "string" ||
        typeof receivedToken !== "string" ||
        expectedToken.length !== receivedToken.length
    ) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedToken),
        Buffer.from(receivedToken)
    );
};

const verifyCsrfToken = (req, res, next) => {
    if (safeMethods.has(req.method)) {
        return next();
    }

    const receivedToken =
        req.body?._csrf ||
        req.get("x-csrf-token");

    if (!tokenMatches(req.session?.csrfToken, receivedToken)) {
        return next(
            new ExpressError(
                403,
                "Invalid or missing security token. Please refresh and try again."
            )
        );
    }

    next();
};

const csrfProtection = (req, res, next) => {
    // Multer must parse multipart bodies before the form token is available.
    if (req.is("multipart/form-data")) {
        return next();
    }

    return verifyCsrfToken(req, res, next);
};

module.exports = {
    ensureCsrfToken,
    verifyCsrfToken,
    csrfProtection,
};
