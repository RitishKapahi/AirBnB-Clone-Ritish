/**
 * utils/ExpressError.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   A small custom Error subclass that carries an HTTP status code alongside
 *   a message, so the final error-handling middleware in app.js can respond
 *   with the right status code (400, 404, etc.) instead of always 500.
 *
 * DEPENDS ON / INTERACTS WITH:
 *   - app.js -> the 404 catch-all and the final error middleware both read
 *     `.statusCode` / `.message` off instances of this class.
 *   - middleware.js -> throws/constructs ExpressError on validation and
 *     authorization failures.
 * ---------------------------------------------------------------------------
 */

"use strict";

class ExpressError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ExpressError";
        Error.captureStackTrace(this, ExpressError);
    }
}

module.exports = ExpressError;