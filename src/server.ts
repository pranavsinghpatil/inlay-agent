import { loadConfig } from "./config.ts";
import { createInlayServer } from "./app.ts";

const config = loadConfig();
const server = createInlayServer(config);

server.listen(config.port, config.host, () => {
  console.log(`Inlay transparent proxy listening at http://${config.host}:${config.port}`);
});
