import { Database, SqlQuerySpec } from "@azure/cosmos";
import { Collections, getContainer } from "../helpers/cosmosHelper.js";
import { Registration, RegistrationWithId } from "./model.js";

export async function getRegistrationsWithoutWaitinglist(cosmosDb: Database): Promise<RegistrationWithId[]> {
  const container = await getContainer(cosmosDb, Collections.Registrations);

  let query = `SELECT * FROM ${Collections.Registrations} a WHERE a.appointment != 'waiting-list'`;
  const querySpec: SqlQuerySpec = {
    query: query,
  };
  const items = await container.items.query<RegistrationWithId>(querySpec).fetchAll();

  return items.resources;
}

export async function getRegistrationsWithWaitinglist(cosmosDb: Database): Promise<RegistrationWithId[]> {
  const container = await getContainer(cosmosDb, Collections.Registrations);

  let query = `SELECT * FROM ${Collections.Registrations} a`;
  const querySpec: SqlQuerySpec = {
    query: query,
  };
  const items = await container.items.query<RegistrationWithId>(querySpec).fetchAll();

  return items.resources;
}

export async function getRegistration(cosmosDb: Database, id: string): Promise<RegistrationWithId | undefined> {
  const container = await getContainer(cosmosDb, Collections.Registrations);

  let query = `SELECT * FROM ${Collections.Registrations} a WHERE a.id = @id`;
  const querySpec: SqlQuerySpec = {
    query: query,
    parameters: [
      {
        name: "@id",
        value: id,
      },
    ],
  };

  const items = await container.items.query<RegistrationWithId>(querySpec).fetchAll();
  if (items.resources.length === 0) {
    return;
  }

  return items.resources[0];
}

export type RegistrationStatistics = {
  totalRegistrations: number;
  registrationsMale: number;
  appointments: {
    isoDate: string;
    numberOfRegistrations: number;
  }[]
}

export async function getRegistrationStatistics(cosmosDb: Database, department: string): Promise<RegistrationStatistics> {
  const registrations = await getRegistrationsWithoutWaitinglist(cosmosDb);

  const totalRegistrations = registrations.length;
  const registrationBoys = registrations.filter(r => r.gender === 'male').length;

  // Get all unique values from appointmentsIsoDates and registrations.appointment
  const allAppointments = [...new Set([...registrations.filter(r => r.department === department).map(r => r.appointment)]).keys()];
  const appointments = allAppointments.map(isoDate => {
    const numberOfRegistrations = registrations.filter(r => r.department === department && r.appointment === isoDate).length;
    return { isoDate, numberOfRegistrations };
  });

  return {
    totalRegistrations,
    registrationsMale: registrationBoys,
    appointments,
  };
}

export async function createRegistration(cosmosDb: Database, registration: Registration): Promise<RegistrationWithId> {
  const container = await getContainer(cosmosDb, Collections.Registrations);

  const newRegistration: RegistrationWithId = {
    ...registration,
    id: crypto.randomUUID(),
  };
  await container.items.create(newRegistration);

  return newRegistration;
}

export async function handleRegistrationExport(cosmosDb: Database): Promise<void> {
  const registrations = await getRegistrationsWithWaitinglist(cosmosDb);
  console.log('id;department;appointment;first_name;last_name;gender;email;phone_number;residence;current_school;current_class');
  for(const registration of registrations
    .sort((a, b) => a.department > b.department ? 1 : -1)
    .sort((a, b) => a.appointment > b.appointment ? 1 : -1)) {
    console.log(`${registration.id};${registration.department};${registration.appointment};${registration.first_name};${registration.last_name};${registration.gender};${registration.email};${registration.phone_number};${registration.residence};${registration.current_school};${registration.current_class}`);
  }
}
