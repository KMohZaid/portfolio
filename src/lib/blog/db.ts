import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "portfolio";

let clientPromise: Promise<MongoClient> | undefined;

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("MongoDB is not configured. Set MONGODB_URI in .env.local.");
  clientPromise ??= new MongoClient(uri).connect();
  const client = await clientPromise;
  return client.db(dbName);
}
