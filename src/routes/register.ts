import express from "express";
import logger from "../helpers/logging.js";
import { Database } from "@azure/cosmos";
import { getAppointments } from "../data/appointments.js";
import { Department } from "../data/model.js";
import { createRegistration, getRegistration, getRegistrationsWithoutWaitinglist, getRegistrationStatistics } from "../data/registrations.js";

type RegisterFormData = {
  first_name: string;
  first_name_error?: string;
  last_name: string;
  last_name_error?: string;
  gender: string;
  gender_error?: string;
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
  appointment?: string;
  appointment_error?: string;
};

type RecaptchaResponse = {
  success: boolean;
  challenge_ts: string;
  hostname: string;
  score: number;
  action: string;
};

function validatePersonalFormData(formData: RegisterFormData): boolean {
  let valid = true;
  if (!formData.first_name) {
    formData.first_name_error = "Bitte Vornamen eingeben";
    valid = false;
  }
  if (!formData.last_name) {
    formData.last_name_error = "Bitte Nachnamen eingeben";
    valid = false;
  }
  if (!formData.gender) {
    formData.gender_error = "Bitte Geschlecht auswählen";
    valid = false;
  }
  if (!formData.email) {
    formData.email_error = "Bitte E-Mail-Adresse eingeben";
    valid = false;
  }
  if (!formData.phone_number) {
    formData.phone_number_error = "Bitte Telefonnummer eingeben";
    valid = false;
  }
  if (!formData.residence) {
    formData.residence_error = "Bitte Wohnort eingeben";
    valid = false;
  }
  if (!formData.current_school) {
    formData.current_school_error = "Bitte aktuelle Schule eingeben";
    valid = false;
  }
  if (!formData.current_class) {
    formData.current_class_error = "Bitte aktuelle Klasse eingeben";
    valid = false;
  }
  if (!formData.department) {
    formData.department_error = "Bitte Abteilung auswählen";
    valid = false;
  }

  return valid;
}

export function createRegistrationRoute(cosmosDb: Database): express.Router {
  const router = express.Router();

  router.get("/", async (req, res) => {
    res.render("registration", {
      captchaKey: process.env.RECAPTCHA_SITE_KEY
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

    if (!result.success || result.action !== "register" || result.score < 0.5 || now.getTime() - challenge_ts.getTime() > 1000 * 60 * 5) {
      logger.error("Recaptcha failed");
      res.status(400).send("Recaptcha failed");
      return;
    }

    const formData: RegisterFormData = req.body;
    const valid = validatePersonalFormData(formData);
    if (!valid) {
      res.render("registration", {
        captchaKey: process.env.RECAPTCHA_SITE_KEY,
        formData,
      });
    } else {
      const apps = await getAppointments(cosmosDb);
      if (!apps) {
        res.status(500).send("Failed to get appointments");
        return;
      }

      let appointments = apps.appointments;
      const totalNumberOfSpaces = appointments.reduce((acc, a) => acc + a.maxAttendees, 0) || 0;
      appointments = appointments.filter(a => a.department === formData.department);

      const stats = await getRegistrationStatistics(cosmosDb, formData.department);

      // Remove appointments that are already full
      for (let i = appointments.length - 1; i >= 0; i--) {
        const a = appointments[i]!;
        const registrations = stats.appointments.find(r => r.isoDate === a.isoDate);
        if (registrations && registrations.numberOfRegistrations >= a.maxAttendees) {
          appointments.splice(i, 1);
        }
      }

      let full = false;
      if (appointments.length === 0 || (formData.gender === "male" && stats.registrationsMale >= totalNumberOfSpaces * (1 - apps.rateGirls))) {
        full = true;
      }
      if (formData.appointment && (formData.appointment === 'waiting-list' || (!full && appointments.some(a => a.isoDate === formData.appointment)))) {
        // Valid appointment has been chosen
        const reg = await createRegistration(cosmosDb, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          gender: formData.gender,
          email: formData.email,
          residence: formData.residence,
          phone_number: formData.phone_number,
          department: formData.department,
          current_school: formData.current_school,
          current_class: formData.current_class,
          appointment: formData.appointment,
        });
        res.redirect(`/registrations/${reg.id}`);
        return;
      }

      res.render("appointments", {
        captchaKey: process.env.RECAPTCHA_SITE_KEY,
        formData,
        appointments: appointments,
        full
      });
    }
  });

  router.get("/registrations/:id", async (req, res) => {
    const id = req.params.id;
    
    const registration = await getRegistration(cosmosDb, id);
    if (!registration) {
      res.status(404).send("Registration not found");
      return;
    }

    res.render("registration_protocol", {
      reg: registration
    });
  });

  return router;
}
