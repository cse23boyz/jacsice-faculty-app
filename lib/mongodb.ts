// import { MongoClient } from "mongodb";

// if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not defined");

// const client = new MongoClient(process.env.MONGODB_URI);
// const clientPromise = client.connect();

// export default clientPromise;

import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env");
}

const uri = process.env.MONGODB_URI;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient>;
}

if (process.env.NODE_ENV === "development") {
  // Use global variable to preserve value across hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, no global variable
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
