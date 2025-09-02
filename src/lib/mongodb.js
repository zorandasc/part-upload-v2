import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

const options = {};

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  //DEFINISI MONGODB CLEIENTA
  client = new MongoClient(uri, options);
  //client.connect8() VRACA PROMISE OBJECT
  //ATTACH THAT PROMISE OBJECT TO global OBJECT
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default clientPromise;
