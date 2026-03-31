import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createAuthHelpers } from "./auth.js";
import { ALLOWED_ORIGINS, COURT_KEY, JWT_SECRET, PORT, SOCKET_ALLOWED_ORIGINS } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { registerAdminRoutes } from "./routes/adminRoutes.js";
import { registerAuthRoutes } from "./routes/authRoutes.js";
import { registerPublicRoutes } from "./routes/publicRoutes.js";
import { createTournamentService } from "./services/tournamentService.js";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: SOCKET_ALLOWED_ORIGINS,
        credentials: true,
    },
});
app.use(cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
const auth = createAuthHelpers(JWT_SECRET);
const tournamentService = createTournamentService({ prisma, io, courtKey: COURT_KEY });
const deps = { prisma, auth, tournamentService };
registerPublicRoutes(app, deps);
registerAuthRoutes(app, deps);
registerAdminRoutes(app, deps);
io.on("connection", async (socket) => {
    socket.emit("state:update", await tournamentService.buildPublicState());
});
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Nomiteni server listening on http://localhost:${PORT}`);
});
