"use strict";

const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: 100,
        },

        fName: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 50,
        },

        lName: {
            type: String,
            trim: true,
            maxlength: 50,
            default: "",
        },

        image: {
            url: {
                type: String,
                trim: true,
            },

            filename: {
                type: String,
                trim: true,
            },
        },

        favorites: [
            {
                type: Schema.Types.ObjectId,
                ref: "Listing",
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
