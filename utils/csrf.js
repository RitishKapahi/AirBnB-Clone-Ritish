"use strict";

const crypto = require("crypto");
const ExpressError = require("./ExpressError.js");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const TOKEN_FIELD = "_csrf";
const TOKEN_HEADER = "x-csrf-token";

const getOrCreateToken = (req) => {
    if (!req.session) return null;

    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    return req.session.csrfToken;
};

const tokenMatches = (expectedToken, submittedToken) => {
    if (
        typeof expectedToken !== "string" ||
        typeof submittedToken !== "string" ||
        expectedToken.length !== submittedToken.length
    ) return false;

    return crypto.timingSafeEqual(
        Buffer.from(expectedToken, "utf8"),
        Buffer.from(submittedToken, "utf8")
    );
};

const verifyCsrfToken = (req, res, next) => {
    const expectedToken = req.session?.csrfToken;
    const submittedToken = req.get(TOKEN_HEADER) || req.body?.[TOKEN_FIELD];

    if (!tokenMatches(expectedToken, submittedToken)) {
        return next(new ExpressError(
            403,
            "Your session security token is missing or expired. Refresh the page and try again."
        ));
    }

    next();
};

const csrfProtection = (req, res, next) => {
    const token = getOrCreateToken(req);

    if (!token) {
        return next(new ExpressError(500, "Unable to initialize session security."));
    }

    req.csrfToken = token;
    res.locals.csrfToken = token;

    if (SAFE_METHODS.has(req.method) || !UNSAFE_METHODS.has(req.method)) {
        return next();
    }

    // Multer must parse multipart fields before the CSRF field can be read.
    // Every multipart mutation route verifies the token immediately after Multer.
    const contentType = String(req.get("content-type") || "").toLowerCase();
    if (contentType.startsWith("multipart/form-data")) {
        req.csrfValidationDeferred = true;
        return next();
    }

    verifyCsrfToken(req, res, next);
};

module.exports = { csrfProtection, verifyCsrfToken };
