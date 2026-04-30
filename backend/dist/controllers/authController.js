"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const errors_1 = require("../utils/errors");
const authService_1 = require("../services/authService");
async function register(req, res, next) {
    try {
        const { username, email, password, role } = req.body ?? {};
        if (!username || !email || !password || !role) {
            throw new errors_1.AppError('username, email, password, and role are required', 400);
        }
        const result = await (0, authService_1.registerUser)({ username, email, password, role });
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
        return res.json(result);
    }
    catch (err) {
        return next(err);
    }
}
//# sourceMappingURL=authController.js.map