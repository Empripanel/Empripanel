"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.isAppError = isAppError;
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
function isAppError(err) {
    return err instanceof AppError;
}
//# sourceMappingURL=errors.js.map