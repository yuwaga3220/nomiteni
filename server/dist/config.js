export const PORT = Number(process.env.PORT ?? 4000);
export const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";
export const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "admin123";
export const COURT_KEY = "courtCount";
export const SOCKET_ALLOWED_ORIGINS = ["http://localhost:5173", "http://localhost:5174"];
export const ALLOWED_ORIGINS = Array.from(new Set([
    ...(process.env.CLIENT_ORIGIN?.split(",").map((v) => v.trim()).filter(Boolean) ?? []),
    ...SOCKET_ALLOWED_ORIGINS,
]));
