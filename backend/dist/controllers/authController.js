"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.logout = logout;
const errors_1 = require("../utils/errors");
const authCookie_1 = require("../utils/authCookie");
const authService_1 = require("../services/authService");
const user_schema_1 = require("../validators/user.schema");
async function register(req, res, next) {
    try {
        const parsed = user_schema_1.registerUserSchema.safeParse(req.body ?? {});
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Validation error',
                errors: parsed.error.flatten(),
            });
        }
        const result = await (0, authService_1.registerUser)(parsed.data);
        res.cookie(authCookie_1.AUTH_COOKIE_NAME, result.token, (0, authCookie_1.getAuthCookieOptions)());
        return res.status(201).json(result);
    }
    catch (err) {
        return next(err);
    }
}
async function login(req, res, next) {
    try {
        const { username, password } = req.body ?? {};
        if (!username || !password) {
            throw new errors_1.AppError('username and password are required', 400);
        }
        const result = await (0, authService_1.loginUser)({ username, password });
        res.cookie(authCookie_1.AUTH_COOKIE_NAME, result.token, (0, authCookie_1.getAuthCookieOptions)());
        return res.json(result);
    }
    catch (err) {
        return next(err);
    }
}
function logout(_req, res) {
    res.clearCookie(authCookie_1.AUTH_COOKIE_NAME, (0, authCookie_1.getAuthCookieClearOptions)());
    return res.status(204).end();
}
//# sourceMappingURL=authController.js.map