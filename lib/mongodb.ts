import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not defined");

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default clientPromise;
