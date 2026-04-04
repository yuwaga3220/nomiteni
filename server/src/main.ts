/**
 * メイン関数（アプリケーションの起動）
 */
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { IoAdapter } from "@nestjs/platform-socket.io";
import cookieParser from "cookie-parser";
import { ALLOWED_ORIGINS, isProduction, PORT } from "./config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(cookieParser());
  app.enableCors({
    origin: isProduction ? ALLOWED_ORIGINS : true,
    credentials: true,
  });
  app.setGlobalPrefix("api");
  await app.listen(PORT);
  // eslint-disable-next-line no-console
  console.log(`Nomiteni Nest listening on http://localhost:${PORT}`);
}

bootstrap();
