import express from "express";
import logger from "../helpers/logging.js";
import { Database } from "@azure/cosmos";
import { getAppointments } from "../data/appointments.js";

type RecaptchaResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  score: number;
  action: string;
};

export function createRegistrationRoute(cosmosDb: Database): express.Router {
  const router = express.Router();

  router.get("/", async (req, res) => {
    const appointments = await getAppointments(cosmosDb);
    if (!appointments) {
      logger.error("No appointments found");
      res.status(500).send("No appointments found");
      return;
    }

    res.render("registration", { captchaKey: process.env.RECAPTCHA_SITE_KEY, appointments: appointments.appointments });
  });

  router.post("/", async (req, res) => {
    const recaptcha_response = req.body["g-recaptcha-response"];

    const recaptchaResult = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptcha_response}`,
    });

    if (!recaptchaResult.ok) {
      logger.error("Recaptcha request failed");
      res.status(500).send("Recaptcha request failed");
      return;
    }

    const result: RecaptchaResponse = await recaptchaResult.json();
    const challenge_ts = new Date(result.challenge_ts);
    const now = new Date();

    logger.info(result);

    if (!result.success || result.action !== "register" || result.score < 0.5 || now.getTime() - challenge_ts.getTime() > 1000 * 60 * 5) {
      logger.error("Recaptcha failed");
      res.status(400).send("Recaptcha failed");
      return;
    }

    const { first_name, last_name, email, phone_number, residence, current_school, current_class, department, appointment } = req.body;

    res.render("registration", { captchaKey: process.env.RECAPTCHA_SITE_KEY });
  });

  return router;
}
