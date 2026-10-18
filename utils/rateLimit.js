/**
 * utils/rateLimit.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Apply a small in-process request limit to sensitive endpoints such as
 *   login, signup, and password changes.
 *
 * NOTE:
 *   This protects each running application instance. A shared store such as
 *   Redis can replace this implementation if the application is scaled out.
 * ---------------------------------------------------------------------------
 */

"use strict";

const ExpressError = require("./ExpressError.js");

const buckets = new Map();
let lastCleanup = Date.now();

const createRateLimiter = ({
    windowMs = 15 * 60 * 1000,
    max = 10,
    message = "Too many attempts. Please try again later.",
} = {}) => (req, res, next) => {
    const now = Date.now();
    const key = String(req.ip) + ":" + req.baseUrl + req.path;
    const current = buckets.get(key);

    if (now - lastCleanup > windowMs) {
        for (const [bucketKey, bucket] of buckets) {
            if (now - bucket.startedAt > windowMs) {
                buckets.delete(bucketKey);
            }
        }

        lastCleanup = now;
    }

    if (!current || now - current.startedAt > windowMs) {
        buckets.set(key, {
            startedAt: now,
            count: 1,
        });
        return next();
    }

    if (current.count >= max) {
        const retryAfter = Math.ceil(
            (windowMs - (now - current.startedAt)) / 1000
        );

        res.set("Retry-After", String(retryAfter));
        return next(new ExpressError(429, message));
    }

    current.count += 1;
    next();
};

module.exports = {
    createRateLimiter,
};
