"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAuthToken = signAuthToken;
exports.verifyAuthToken = verifyAuthToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("./errors");
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new errors_1.AppError('JWT_SECRET is not configured', 500);
    return secret;
}
function signAuthToken(payload) {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}
function verifyAuthToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, getJwtSecret());
    if (typeof decoded === 'string')
        throw new errors_1.AppError('Invalid token', 401);
    const userId = decoded.userId;
    const role = decoded.role;
    if (typeof userId !== 'number' || typeof role !== 'string') {
        throw new errors_1.AppError('Invalid token payload', 401);
    }
    return { userId, role };
}
//# sourceMappingURL=jwt.js.map