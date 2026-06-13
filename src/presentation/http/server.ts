import { env } from "../../config/env.js";
import { createApp } from "./create-app.js";

const app = createApp();

const port = env.PORT;
const host = env.HOST;

await app.listen({
  port,
  host,
});
