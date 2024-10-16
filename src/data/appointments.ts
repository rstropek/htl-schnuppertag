import { Database, SqlQuerySpec } from "@azure/cosmos";
import { Collections, getContainer } from "../helpers/cosmosHelper.js";
import { Appointments, AppointmentsWithId } from "./model.js";
import { isWorkdaysInThePast } from "../helpers/dateCalculations.js";
import clap from "command-line-args"
import logger from "../helpers/logging.js";
import fs from "fs";

export async function updateAppointments(cosmosDb: Database, appointments: Appointments): Promise<AppointmentsWithId> {
  const container = await getContainer(cosmosDb, Collections.Appointments);

  const newAppointments: AppointmentsWithId = {
    ...appointments,
    id: crypto.randomUUID(),
  };
  await container.items.create(newAppointments);

  // Delete all other appointment records
  let query = `SELECT * FROM ${Collections.Appointments} a`;
  const querySpec: SqlQuerySpec = {
    query: query,
  };
  const items = await container.items.query<AppointmentsWithId>(querySpec).fetchNext();
  for (const item of items.resources) {
    if (item.id !== newAppointments.id) {
      await container.item(item.id).delete();
    }
  }

  return newAppointments;
}

export async function getAppointments(cosmosDb: Database): Promise<Appointments | undefined> {
  const container = await getContainer(cosmosDb, Collections.Appointments);

  let query = `SELECT * FROM ${Collections.Appointments} a`;
  const querySpec: SqlQuerySpec = {
    query: query,
  };
  const items = await container.items.query<AppointmentsWithId>(querySpec).fetchNext();
  if (items.resources.length === 0 || !items.resources[0]) {
    return;
  }

  const result: Appointments = {
    ...items.resources[0], appointments: items.resources[0].appointments.filter(
      (appointment) => isWorkdaysInThePast(appointment.isoDate, new Date(), -2))
  };

  return result;
}

export async function handleAppointmentImport(cosmosDb: Database, argv: string[]): Promise<void> {
  const importDefinitions = [
    { name: 'path', alias: 'p' }
  ];
  const importOptions = clap(importDefinitions, { argv });

  if (!importOptions.path) {
    logger.error("Missing required parameter --path");
    return;
  }

  // Read appointments from file
  const appointments = JSON.parse(fs.readFileSync(importOptions.path, 'utf-8')) as Appointments;
  logger.info("Importing appointments", { appointments });
  await updateAppointments(cosmosDb, appointments);
  logger.info("Import successful");
}
