"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDocument = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();
exports.analyzeDocument = (0, https_1.onCall)(async (request) => {
    console.log("Health check triggered");
    return { status: "ready" };
});
//# sourceMappingURL=index.js.map