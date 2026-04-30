"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    const header = req.header('Authorization');
    if (!header) {
        return res.status(401).json({ success: false, message: 'Missing Authorization header' });
    }
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ success: false, message: 'Invalid Authorization format' });
    }
    try {
        const payload = (0, jwt_1.verifyAuthToken)(token);
        req.auth = { userId: payload.userId, role: payload.role };
        return next();
    }
    catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}
//# sourceMappingURL=authenticate.js.map