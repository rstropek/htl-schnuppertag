import express from "express";
import logger from "../helpers/logging.js";
import { Database } from "@azure/cosmos";
import { getAppointments } from "../data/appointments.js";

type RegisterFormData = {
  first_name: string;
  first_name_error?: string;
  last_name: string;
  last_name_error?: string;
  email: string;
  email_error?: string;
  phone_number: string;
  phone_number_error?: string;
  residence: string;
  residence_error?: string;
  current_school: string;
  current_school_error?: string;
  current_class: string;
  current_class_error?: string;
  department: string;
  department_error?: string;
  appointment: string;
  appointment_error?: string;
};

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

    res.render("registration", {
      captchaKey: process.env.RECAPTCHA_SITE_KEY,
      appointments: appointments.appointments,
    });
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

    const formData: RegisterFormData = req.body;
    if (!formData.first_name) {
      formData.first_name_error = "Bitte Vornamen eingeben";
    }
    if (!formData.last_name) {
      formData.last_name_error = "Bitte Nachnamen eingeben";
    }
    if (!formData.email) {
      formData.email_error = "Bitte E-Mail-Adresse eingeben";
    }
    if (!formData.phone_number) {
      formData.phone_number_error = "Bitte Telefonnummer eingeben";
    }
    if (!formData.residence) {
      formData.residence_error = "Bitte Wohnort eingeben";
    }
    if (!formData.current_school) {
      formData.current_school_error = "Bitte aktuelle Schule eingeben";
    }
    if (!formData.current_class) {
      formData.current_class_error = "Bitte aktuelle Klasse eingeben";
    }
    if (!formData.department) {
      formData.department_error = "Bitte Abteilung auswählen";
    }
    if (!formData.appointment) {
      formData.appointment_error = "Bitte Termin auswählen";
    }

    const appointments = await getAppointments(cosmosDb);
    if (!appointments) {
      logger.error("No appointments found");
      res.status(500).send("No appointments found");
      return;
    }

    formData.first_name_error = "Bitte Vornamen eingeben";
    res.render("registration", {
      captchaKey: process.env.RECAPTCHA_SITE_KEY,
      appointments: appointments.appointments,
      formData,
    });
  });

  return router;
}
