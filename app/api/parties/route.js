import { NextResponse } from "next/server";
import { getPartiesCollection } from "@/lib/mongodb";
import { validateEntry } from "@/lib/ledger";

export const dynamic = "force-dynamic";

function toClient(doc) {
  const { _id, ...rest } = doc;
  return { id: _id.toString(), ...rest };
}

export async function GET() {
  try {
    const col = await getPartiesCollection();
    const docs = await col.find({}).sort({ date: -1 }).toArray();
    return NextResponse.json(docs.map(toClient));
  } catch (err) {
    console.error("GET /api/parties failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { entry, error } = validateEntry(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const col = await getPartiesCollection();
    const result = await col.insertOne(entry);
    return NextResponse.json({ id: result.insertedId.toString(), ...entry }, { status: 201 });
  } catch (err) {
    console.error("POST /api/parties failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
