import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getPartiesCollection, getEntriesCollection } from "@/lib/mongodb";
import { validateEntry } from "@/lib/ledger";

export const dynamic = "force-dynamic";

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const _id = parseId(id);
    if (!_id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const col = await getPartiesCollection();
    const doc = await col.findOne({ _id });
    if (!doc) return NextResponse.json({ error: "Party not found" }, { status: 404 });

    const { _id: docId, ...rest } = doc;
    return NextResponse.json({ id: docId.toString(), ...rest });
  } catch (err) {
    console.error("GET /api/parties/[id] failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const _id = parseId(id);
    if (!_id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json();
    const { entry, error } = validateEntry(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const col = await getPartiesCollection();
    const result = await col.updateOne({ _id }, { $set: entry });
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }
    return NextResponse.json({ id, ...entry });
  } catch (err) {
    console.error("PUT /api/parties/[id] failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const _id = parseId(id);
    if (!_id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const col = await getPartiesCollection();
    const result = await col.deleteOne({ _id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }
    const entriesCol = await getEntriesCollection();
    await entriesCol.deleteMany({ partyId: _id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/parties/[id] failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
