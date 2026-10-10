"use strict";

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "RitishMajorProject_DEV",
        allowedFormats: ["png", "jpg", "jpeg"],
        resource_type: "image",
    },
});

module.exports = {
    cloudinary,
    storage,
};