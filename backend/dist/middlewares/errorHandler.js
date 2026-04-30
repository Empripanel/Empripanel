"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
function errorHandler(err, _req, res, _next) {
    console.error(err);
    const status = (0, errors_1.isAppError)(err) ? err.statusCode : 500;
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(status).json({ success: false, message });
}
//# sourceMappingURL=errorHandler.js.map