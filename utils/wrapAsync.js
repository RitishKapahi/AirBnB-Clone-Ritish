/**
 * utils/wrapAsync.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   A higher-order function that wraps an async Express route handler so any
 *   rejected promise (e.g. a thrown error inside an `await`ed DB call) is
 *   automatically forwarded to `next(err)` instead of crashing the process
 *   with an unhandled rejection. Without this, every controller would need
 *   its own try/catch.
 *
 * DEPENDS ON / INTERACTS WITH:
 *   - routers/*.js -> every controller function passed to a route is wrapped
 *     in wrapAsync(...) before being registered.
 *   - app.js -> the errors it forwards end up in the final error-handling
 *     middleware there.
 * ---------------------------------------------------------------------------
 */

"use strict";

module.exports = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};