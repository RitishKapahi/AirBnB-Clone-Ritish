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
const assert = require("node:assert/strict");
const { csrfProtection, verifyCsrfToken } = require("../utils/csrf.js");
const { createRateLimiter } = require("../utils/rateLimit.js");

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


const makeSecurityRequest = ({
    method = "GET",
    session = {},
    body = {},
    contentType = "application/x-www-form-urlencoded",
    csrfHeader,
} = {}) => ({
    method,
    session,
    body,
    ip: "192.0.2.10",
    socket: { remoteAddress: "192.0.2.10" },
    get(name) {
        const headerName = String(name).toLowerCase();
        if (headerName === "content-type") return contentType;
        if (headerName === "x-csrf-token") return csrfHeader;
        return undefined;
    },
});

const runMiddleware = (middleware, req) => {
    const res = {
        locals: {},
        headers: {},
        setHeader(name, value) {
            this.headers[name] = value;
        },
    };
    let called = false;
    let error;
    middleware(req, res, (nextError) => {
        called = true;
        error = nextError;
    });
    return { called, error, req, res };
};

// CSRF token creation and validation (valid, invalid, header, and multipart).
const csrfSession = {};
const csrfGet = runMiddleware(
    csrfProtection,
    makeSecurityRequest({ method: "GET", session: csrfSession })
);
assert.equal(csrfGet.called, true);
assert.match(csrfSession.csrfToken, /^[a-f0-9]{64}$/);

const csrfValid = runMiddleware(
    csrfProtection,
    makeSecurityRequest({
        method: "POST",
        session: csrfSession,
        body: { _csrf: csrfSession.csrfToken },
    })
);
assert.equal(csrfValid.error, undefined);

const csrfMissing = runMiddleware(
    csrfProtection,
    makeSecurityRequest({ method: "POST", session: csrfSession })
);
assert.equal(csrfMissing.error?.statusCode, 403);

const csrfHeader = runMiddleware(
    csrfProtection,
    makeSecurityRequest({
        method: "DELETE",
        session: csrfSession,
        csrfHeader: csrfSession.csrfToken,
    })
);
assert.equal(csrfHeader.error, undefined);

const multipartRequest = makeSecurityRequest({
    method: "POST",
    session: csrfSession,
    contentType: "multipart/form-data; boundary=test",
});
const multipartDeferred = runMiddleware(csrfProtection, multipartRequest);
assert.equal(multipartDeferred.error, undefined);
assert.equal(multipartRequest.csrfValidationDeferred, true);
multipartRequest.body = { _csrf: csrfSession.csrfToken };
const multipartValid = runMiddleware(verifyCsrfToken, multipartRequest);
assert.equal(multipartValid.error, undefined);

// Scoped rate limiter permits the configured allowance and then rejects.
const testLimiter = createRateLimiter({
    windowMs: 60_000,
    maxRequests: 2,
    message: "Test limit reached.",
});
const firstLimitRequest = runMiddleware(testLimiter, makeSecurityRequest({ method: "POST" }));
const secondLimitRequest = runMiddleware(testLimiter, makeSecurityRequest({ method: "POST" }));
const thirdLimitRequest = runMiddleware(testLimiter, makeSecurityRequest({ method: "POST" }));
assert.equal(firstLimitRequest.error, undefined);
assert.equal(secondLimitRequest.error, undefined);
assert.equal(thirdLimitRequest.error?.statusCode, 429);

// Every POST form in the EJS templates must render a synchronizer token.
const formsWithoutCsrf = [];
for (const filePath of ejsFiles) {
    const source = fs.readFileSync(filePath, "utf8").replace(/<%#[\\s\\S]*?%>/g, "");
    const formOpening = /<form\\b(?:(?:<%[\\s\\S]*?%>)|[^>])*>/gi;
    let match;
    while ((match = formOpening.exec(source)) !== null) {
        if (!/\\bmethod\\s*=\\s*["']post["']/i.test(match[0])) continue;
        const closing = source.indexOf("</form>", match.index + match[0].length);
        const formBody = closing === -1 ? "" : source.slice(match.index + match[0].length, closing);
        if (closing === -1 || !/name\\s*=\\s*["']_csrf["']/i.test(formBody)) {
            formsWithoutCsrf.push(relative(filePath));
        }
    }
}
assert.deepEqual([...new Set(formsWithoutCsrf)], [], "Every POST form must include a CSRF token");

const uploadRouteFiles = ["routers/listing.js", "routers/user.js", "routers/admin.js"];
let protectedUploadRoutes = 0;
for (const relativePath of uploadRouteFiles) {
    const routeSource = fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
    protectedUploadRoutes += (routeSource.match(/upload\\.single\\([^)]*\\),\\s*verifyCsrfToken,/g) || []).length;
}
assert.equal(protectedUploadRoutes, 5, "Every multipart upload route must verify its CSRF token");

const userRoutes = fs.readFileSync(path.join(projectRoot, "routers/user.js"), "utf8");
assert.match(userRoutes, /router\\.post\\(\\s*["']\\/logout["']/);
assert.match(userRoutes, /loginLimiter/);
assert.match(userRoutes, /signupLimiter/);
assert.match(userRoutes, /passwordChangeLimiter/);

console.log("Security checks: CSRF and rate-limiter tests passed");

console.log(`JavaScript syntax: ${jsFiles.length} files passed`);
console.log(`EJS compilation: ${ejsFiles.length} files passed`);
console.log(`CSS structure: ${cssFiles.length} files passed`);
console.log("Stylesheet references: all resolved");
