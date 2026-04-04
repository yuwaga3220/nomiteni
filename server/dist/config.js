"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProduction = exports.ALLOWED_ORIGINS = exports.SOCKET_ALLOWED_ORIGINS = exports.COURT_KEY = exports.ADMIN_PASSCODE = exports.JWT_SECRET = exports.PORT = void 0;
exports.PORT = Number(process.env.PORT ?? 4000);
exports.JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
exports.ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "admin123";
exports.COURT_KEY = "courtCount";
exports.SOCKET_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
];
exports.ALLOWED_ORIGINS = Array.from(new Set([
    ...(process.env.CLIENT_ORIGIN?.split(",").map((v) => v.trim()).filter(Boolean) ?? []),
    ...exports.SOCKET_ALLOWED_ORIGINS,
]));
exports.isProduction = process.env.NODE_ENV === "production";
//# sourceMappingURL=config.js.map