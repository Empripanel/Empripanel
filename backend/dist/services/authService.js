"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const client_1 = require("@prisma/client");
const prisma_1 = require("../utils/prisma");
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
function assertRegistrationRole(role) {
    if (role !== 'EXPLORER' && role !== 'BUSINESS') {
        throw new errors_1.AppError('Invalid role. Must be EXPLORER or BUSINESS', 400);
    }
}
async function registerUser(input) {
    const { username, email, password } = input;
    if (input.role === 'ADMIN') {
        throw new errors_1.AppError('ADMIN role cannot be assigned during registration', 400);
    }
    assertRegistrationRole(input.role);
    const existing = await prisma_1.prisma.user.findFirst({
        where: { OR: [{ username }, { email }] },
        select: { username: true, email: true },
    });
    if (existing?.username === username)
        throw new errors_1.AppError('Username already exists', 400);
    if (existing?.email === email)
        throw new errors_1.AppError('Email already exists', 400);
    const hashed = await bcryptjs_1.default.hash(password, 10);
    try {
        const user = await prisma_1.prisma.user.create({
            data: {
                username,
                email,
                password: hashed,
                role: input.role,
            },
            select: { id: true, username: true, email: true, role: true },
        });
        const token = (0, jwt_1.signAuthToken)({ userId: user.id, role: user.role });
        return { token, user };
    }
    catch (err) {
        if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new errors_1.AppError('Username or email already exists', 400);
        }
        throw err;
    }
}
async function loginUser(input) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { username: input.username },
        select: { id: true, username: true, email: true, role: true, password: true, isDeleted: true },
    });
    if (!user)
        throw new errors_1.AppError('Invalid credentials', 401);
    if (user.isDeleted)
        throw new errors_1.AppError('Account does not exist.', 401);
    const ok = await bcryptjs_1.default.compare(input.password, user.password);
    if (!ok)
        throw new errors_1.AppError('Invalid credentials', 401);
    const token = (0, jwt_1.signAuthToken)({ userId: user.id, role: user.role });
    const { password: _pw, ...safeUser } = user;
    return { token, user: safeUser };
}
//# sourceMappingURL=authService.js.map