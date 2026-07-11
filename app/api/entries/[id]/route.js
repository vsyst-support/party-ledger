import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getEntriesCollection, syncPartyBalance } from "@/lib/mongodb";
import { validateSubEntry } from "@/lib/ledger";

export const dynamic = "force-dynamic";

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const _id = parseId(id);
    if (!_id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await request.json();
    const { entry, error } = validateSubEntry(body);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const col = await getEntriesCollection();
    const existing = await col.findOne({ _id });
    if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    await col.updateOne({ _id }, { $set: entry });
    await syncPartyBalance(existing.partyId);
    return NextResponse.json({ id, ...entry });
  } catch (err) {
    console.error("PUT /api/entries/[id] failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const _id = parseId(id);
    if (!_id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const col = await getEntriesCollection();
    const existing = await col.findOne({ _id });
    if (!existing) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    await col.deleteOne({ _id });
    await syncPartyBalance(existing.partyId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/entries/[id] failed:", err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
