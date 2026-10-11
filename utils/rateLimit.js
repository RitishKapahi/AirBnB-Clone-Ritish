"use strict";

const ExpressError = require("./ExpressError.js");

const createRateLimiter = ({
    windowMs,
    maxRequests,
    message = "Too many requests. Please try again later.",
}) => {
    if (!Number.isFinite(windowMs) || windowMs <= 0 || !Number.isInteger(maxRequests) || maxRequests < 1) {
        throw new TypeError("A rate limiter requires a positive windowMs and maxRequests.");
    }

    const buckets = new Map();

    return (req, res, next) => {
        const now = Date.now();
        const key = String(req.ip || req.socket?.remoteAddress || "unknown");
        let bucket = buckets.get(key);

        if (!bucket || bucket.resetAt <= now) {
            bucket = { count: 0, resetAt: now + windowMs };
        }

        bucket.count += 1;
        buckets.set(key, bucket);

        // Keep the in-memory map bounded on long-lived instances.
        if (buckets.size > 10000) {
            for (const [bucketKey, entry] of buckets) {
                if (entry.resetAt <= now) buckets.delete(bucketKey);
            }
        }

        const remaining = Math.max(0, maxRequests - bucket.count);
        const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

        res.setHeader("RateLimit-Limit", String(maxRequests));
        res.setHeader("RateLimit-Remaining", String(remaining));
        res.setHeader("RateLimit-Policy", String(maxRequests) + ";w=" + Math.ceil(windowMs / 1000));

        if (bucket.count > maxRequests) {
            res.setHeader("Retry-After", String(retryAfterSeconds));
            return next(new ExpressError(
                429,
                message + " Please retry in about " + retryAfterSeconds + " seconds."
            ));
        }

        next();
    };
};

module.exports = { createRateLimiter };
