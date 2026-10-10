/*
 * utils/upload.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Central Multer upload configuration used by listing and profile-image
 *   uploads. Provides server-side file-size and file-type validation.
 *
 * DEPENDS ON / INTERACTS WITH:
 *   - cloudConfig.js -> Cloudinary storage configuration.
 *   - routers/listing.js and routers/user.js -> uses this upload middleware.
 * ---------------------------------------------------------------------------
 */

"use strict";

const path = require("path");
const multer = require("multer");

const { storage } = require("../cloudConfig.js");
const ExpressError = require("./ExpressError.js");

const MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes

const allowedMimeTypes = new Set([
    "image/png",
    "image/jpeg",
]);

const allowedExtensions = new Set([
    ".png",
    ".jpg",
    ".jpeg",
]);

const upload = multer({
    storage,

    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1,
    },

    fileFilter: (req, file, cb) => {
        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        if (
            !allowedMimeTypes.has(file.mimetype) ||
            !allowedExtensions.has(extension)
        ) {
            return cb(
                new ExpressError(
                    400,
                    "Only PNG, JPG, and JPEG images are allowed."
                )
            );
        }

        cb(null, true);
    },
});

module.exports = upload;