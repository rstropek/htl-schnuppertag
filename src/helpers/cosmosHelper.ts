import { CosmosClient, Database } from "@azure/cosmos";
import logger from "./logging.js";

export async function createCosmosClient(): Promise<CosmosClient | undefined> {
  const endpoint = process.env.COSMOS_URI;
  if (!endpoint) {
    logger.error("Secret COSMOS_URI not found");
    return;
  }

  const key = process.env.COSMOS_KEY;
  if (!key) {
    logger.error("Secret COSMOS-KEY not found");
    return;
  }

  return new CosmosClient({ endpoint, key });
}

export async function getDatabase(client: CosmosClient, databaseId: string): Promise<Database> {
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  return database;
}

export enum Collections {
  Appointments = "appointments",
  Registrations = "registrations",
}

export async function getContainer(database: Database, containerId: string) {
  const { container } = await database.containers.createIfNotExists({ id: containerId });
  return container;
}
