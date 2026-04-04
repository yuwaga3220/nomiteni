import "dotenv/config";
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { Server } from "socket.io";
import { socketCorsOrigins } from "./src/lib/config";
import { setIo } from "./src/lib/socket-registry";
import { buildPublicState } from "./src/lib/tournament-service";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT ?? 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

void app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => {
      const parsedUrl = parse(req.url ?? "", true);
      void handle(req, res, parsedUrl);
    });

    httpServer.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // eslint-disable-next-line no-console
        console.error(
          `[Nomiteni] ポート ${port} は既に使われています（別ターミナルの dev や他アプリを止めるか、PORT=3001 のように変更してください）。`,
        );
        process.exit(1);
        return;
      }
      throw err;
    });

    const io = new Server(httpServer, {
      path: "/socket.io",
      cors: { origin: socketCorsOrigins(), credentials: true },
    });
    setIo(io);
    io.on("connection", (socket) => {
      void buildPublicState().then((state) => socket.emit("state:update", state));
    });

    httpServer.listen(port, hostname, () => {
      // eslint-disable-next-line no-console
      console.log(`Nomiteni ready on http://${hostname}:${port}`);
    });
  })
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error("[Nomiteni] 起動に失敗しました:", err);
    process.exit(1);
  });
