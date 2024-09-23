import express from "express";
import pinoHTTP from "pino-http";
import dotenv from "dotenv";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";

import logger from "./helpers/logging.js";
import { createRegistrationRoute } from "./routes/register.js";

const isDevelopment = process.env.NODE_ENV === "development";
logger.info({ configuration: isDevelopment ? "development" : "production" }, "Start configuration");

dotenv.config({
  path: ".env",
  debug: isDevelopment,
});

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.engine("hbs", engine({
  extname: "hbs",
  defaultLayout: "layout",
  layoutsDir: path.join(__dirname, "views", "layouts"),
  partialsDir: path.join(__dirname, "views", "partials"),
  helpers: {
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

app.use("/", createRegistrationRoute());
app.use("/", express.static(path.join(__dirname, 'public')));

const PORT = process.env["PORT"] || 8080;
app.listen(PORT, () => {
  logger.info({ PORT }, "Listening");
});
