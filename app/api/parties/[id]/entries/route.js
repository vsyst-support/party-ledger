import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getPartiesCollection, getEntriesCollection, syncPartyBalance } from "@/lib/mongodb";
import { validateSubEntry } from "@/lib/ledger";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid party id" }, { status: 400 });
    }
    const partyId = new ObjectId(id);

    const col = await getEntriesCollection();
    // Oldest first, insertion order as tiebreaker, so the running balance reads top to bottom.
    const docs = await col.find({ partyId }).sort({ date: 1, _id: 1 }).toArray();

    let running = 0;
    const entries = docs.map(({ _id, partyId: pid, ...rest }) => {
      running += rest.dr - rest.cr;
      return { id: _id.toString(), ...rest, balance: running };
    });
    return NextResponse.json(entries);
  } catch (err) {
    console.error("GET /api/parties/[id]/entries failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid party id" }, { status: 400 });
    }
    const partyId = new ObjectId(id);

    const partiesCol = await getPartiesCollection();
    const party = await partiesCol.findOne({ _id: partyId });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const body = await request.json();
    const { entry, error } = validateSubEntry(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const col = await getEntriesCollection();
    const result = await col.insertOne({ partyId, ...entry });
    await syncPartyBalance(partyId);
    return NextResponse.json({ id: result.insertedId.toString(), ...entry }, { status: 201 });
  } catch (err) {
    console.error("POST /api/parties/[id]/entries failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
