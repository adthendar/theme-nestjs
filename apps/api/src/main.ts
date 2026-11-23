import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule, configure } from "./app.js";
config({ path: "../../.env" });
async function main() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  await configure(app);
  await app.listen(Number(process.env.PORT ?? 3001), "0.0.0.0");
}
void main();
