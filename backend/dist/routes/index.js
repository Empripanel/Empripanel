"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const businessRoutes_1 = __importDefault(require("./businessRoutes"));
const usersRoutes_1 = __importDefault(require("./usersRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const rankingRoutes_1 = __importDefault(require("./rankingRoutes"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'empripanel-backend' });
});
router.use('/auth', authRoutes_1.default);
router.use('/business', businessRoutes_1.default);
router.use('/users', usersRoutes_1.default);
router.use('/user', usersRoutes_1.default);
router.use('/admin', adminRoutes_1.default);
router.use('/rankings', rankingRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map