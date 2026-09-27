import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const metalId = searchParams.get("metal_id");

    let query = `
      SELECT 
        i.id,
        i.metal_id,
        m.name AS metal_name,
        m.category AS metal_category,
        i.weight_kg,
        i.acquisition_cost,
        i.unit_cost_per_kg,
        i.received_date,
        i.supplier,
        i.photo_url,
        i.notes,
        i.created_at
      FROM intake_records i
      JOIN metals m ON i.metal_id = m.id
    `;

    if (metalId) {
      query += ` WHERE i.metal_id = ${parseInt(metalId, 10)}`;
    }

    query += ` ORDER BY i.received_date DESC, i.id DESC LIMIT ${limit}`;

    const intakes = db.prepare(query).all();
    return NextResponse.json({ success: true, data: intakes });
  } catch (error: unknown) {
    console.error("Intake GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      metal_id,
      weight_kg,
      acquisition_cost,
      received_date,
      supplier,
      photo_url,
      notes,
    } = body;

    const numWeight = parseFloat(weight_kg);
    const numCost = parseFloat(acquisition_cost);
    const numMetalId = parseInt(metal_id, 10);

    if (!numMetalId || isNaN(numWeight) || numWeight <= 0 || isNaN(numCost) || numCost < 0) {
      return NextResponse.json(
        { success: false, error: "Valid metal type, weight (>0), and acquisition cost (>=0) are required." },
        { status: 400 }
      );
    }

    const unitCost = numWeight > 0 ? numCost / numWeight : 0;
    const date = received_date || new Date().toISOString().split("T")[0];

    const insert = db.prepare(`
      INSERT INTO intake_records (
        metal_id, weight_kg, acquisition_cost, unit_cost_per_kg,
        received_date, supplier, photo_url, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      numMetalId,
      numWeight,
      numCost,
      unitCost,
      date,
      supplier || "Warehouse Intake Scale",
      photo_url || null,
      notes || ""
    );

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        metal_id: numMetalId,
        weight_kg: numWeight,
        acquisition_cost: numCost,
        unit_cost_per_kg: unitCost,
        received_date: date,
        supplier,
        photo_url,
        notes,
      },
    });
  } catch (error: unknown) {
    console.error("Intake POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
