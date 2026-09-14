import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017";
const databaseName =
  process.env.MONGO_DATABASE || "IncidentManagement";

const client = new MongoClient(mongoUri);

let database: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (database) {
    return database;
  }

  try {
    await client.connect();

    database = client.db(databaseName);

    // Verify that MongoDB is actually responding.
    await database.command({ ping: 1 });

    console.log("MongoDB connected successfully");

    return database;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}

export function getMongoDB(): Db {
  if (!database) {
    throw new Error("MongoDB is not connected");
  }

  return database;
}