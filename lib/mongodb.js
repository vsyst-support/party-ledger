import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI environment variable (set it in .env.local)");
}

// Cache the client across hot reloads in dev and across route invocations in prod,
// so we don't open a new connection pool on every request.
let clientPromise = globalThis._mongoClientPromise;

if (!clientPromise) {
  const client = new MongoClient(uri);
  clientPromise = client.connect();
  globalThis._mongoClientPromise = clientPromise;
}

export async function getPartiesCollection() {
  const client = await clientPromise;
  return client.db().collection("parties");
}

export async function getEntriesCollection() {
  const client = await clientPromise;
  return client.db().collection("entries");
}

// Keep the party's headline balance in sync with its sub-entries.
// Convention: positive = receivable, so balance = Σ Dr (paid out) − Σ Cr (received).
export async function syncPartyBalance(partyId) {
  const entriesCol = await getEntriesCollection();
  const entries = await entriesCol.find({ partyId }).toArray();
  const balance = entries.reduce((sum, e) => sum + e.dr - e.cr, 0);
  const partiesCol = await getPartiesCollection();
  await partiesCol.updateOne({ _id: partyId }, { $set: { balance } });
  return balance;
}
