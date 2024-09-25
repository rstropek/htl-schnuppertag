import express from "express";
import pinoHTTP from "pino-http";
import dotenv from "dotenv";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import clap from "command-line-args"

import logger from "./helpers/logging.js";
import { createRegistrationRoute } from "./routes/register.js";
import { createCosmosClient, getDatabase } from "./helpers/cosmosHelper.js";
import { handleAppointmentImport } from "./data/appointments.js";

const isDevelopment = process.env.NODE_ENV === "development";
logger.info({ configuration: isDevelopment ? "development" : "production" }, "Start configuration");

dotenv.config({
  path: ".env",
  debug: isDevelopment,
});

const cosmosClient = await createCosmosClient();
if (!cosmosClient) {
  logger.error("Failed to get CosmosClient");
  process.exit(1);
}

const cosmosDb = await getDatabase(cosmosClient, "tsweb");

const mainDefinitions = [
  { name: 'command', defaultOption: true }
];
const mainOptions = clap(mainDefinitions, { stopAtFirstUnknown: true });
const argv = mainOptions._unknown || []
if (mainOptions.command === 'import') {
  await handleAppointmentImport(cosmosDb, argv);
  process.exit(0);
}

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.engine("hbs", engine({
  extname: "hbs",
  defaultLayout: "layout",
  layoutsDir: path.join(__dirname, "views", "layouts"),
  partialsDir: path.join(__dirname, "views", "partials"),
  helpers: {
    eq(a: any, b: any) { return a === b; },
    stringify(x: any) { return JSON.stringify(x); },
    dateFormat(dateStr: string) {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      return new Date(dateStr).toLocaleString('de-AT', options).replace(',', '');
    },
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/", createRegistrationRoute(cosmosDb));
app.use("/", express.static(path.join(__dirname, 'public')));

const PORT = process.env["PORT"] || 8080;
app.listen(PORT, () => {
  logger.info({ PORT }, "Listening");
});
