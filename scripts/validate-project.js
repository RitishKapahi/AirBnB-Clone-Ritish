/*
 * scripts/validate-project.js
 * ---------------------------------------------------------------------------
 * PURPOSE:
 *   Fast, non-destructive project validation for CI and local development.
 *   It checks JavaScript syntax, EJS compilation, CSS brace balance, and
 *   stylesheet references without connecting to external services or MongoDB.
 * ---------------------------------------------------------------------------
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ejs = require("ejs");

const projectRoot = path.resolve(__dirname, "..");

const walk = (directory) =>
    fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            return entry.name === "node_modules" || entry.name === ".git"
                ? []
                : walk(entryPath);
        }

        return [entryPath];
    });

const relative = (filePath) =>
    path.relative(projectRoot, filePath) || ".";

const files = walk(projectRoot);
const jsFiles = files.filter((filePath) => filePath.endsWith(".js"));
const ejsFiles = files.filter((filePath) => filePath.endsWith(".ejs"));
const cssFiles = files.filter((filePath) => filePath.endsWith(".css"));

for (const filePath of jsFiles) {
    execFileSync(process.execPath, ["--check", filePath], {
        stdio: "pipe",
    });
}

for (const filePath of ejsFiles) {
    ejs.compile(fs.readFileSync(filePath, "utf8"), {
        filename: filePath,
    });
}

for (const filePath of cssFiles) {
    const css = fs.readFileSync(filePath, "utf8");
    let braceBalance = 0;

    for (const character of css) {
        if (character === "{") braceBalance += 1;
        if (character === "}") braceBalance -= 1;

        if (braceBalance < 0) {
            throw new Error(`Unbalanced CSS braces: ${relative(filePath)}`);
        }
    }

    if (braceBalance !== 0) {
        throw new Error(`Unbalanced CSS braces: ${relative(filePath)}`);
    }
}

const missingStylesheets = new Set();

for (const filePath of ejsFiles) {
    const template = fs.readFileSync(filePath, "utf8");

    for (const match of template.matchAll(
        /href=["']\/css\/([^"']+\.css)["']/g
    )) {
        const stylesheetPath = path.join(
            projectRoot,
            "public",
            "css",
            match[1]
        );

        if (!fs.existsSync(stylesheetPath)) {
            missingStylesheets.add(
                `${relative(filePath)} -> /css/${match[1]}`
            );
        }
    }
}

if (missingStylesheets.size > 0) {
    throw new Error(
        `Missing stylesheet references:\n${[
            ...missingStylesheets,
        ].join("\n")}`
    );
}

console.log(`JavaScript syntax: ${jsFiles.length} files passed`);
console.log(`EJS compilation: ${ejsFiles.length} files passed`);
console.log(`CSS structure: ${cssFiles.length} files passed`);
console.log("Stylesheet references: all resolved");
