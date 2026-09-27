import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get metals with their live on-hand stock and average cost
    const metals = db.prepare(`
      SELECT 
        m.id,
        m.name,
        m.category,
        m.default_unit,
        m.description,
        COALESCE((SELECT SUM(weight_kg) FROM intake_records WHERE metal_id = m.id), 0) AS total_received_kg,
        COALESCE((SELECT SUM(weight_kg) FROM sales_records WHERE metal_id = m.id), 0) AS total_sold_kg,
        (COALESCE((SELECT SUM(weight_kg) FROM intake_records WHERE metal_id = m.id), 0) - 
         COALESCE((SELECT SUM(weight_kg) FROM sales_records WHERE metal_id = m.id), 0)) AS on_hand_kg,
        COALESCE((
          SELECT SUM(acquisition_cost) / NULLIF(SUM(weight_kg), 0) 
          FROM intake_records WHERE metal_id = m.id
        ), 0) AS avg_unit_cost_kg
      FROM metals m
      ORDER BY m.id ASC
    `).all();

    return NextResponse.json({ success: true, data: metals });
  } catch (error: unknown) {
    console.error("Metals GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, default_unit = "kg", description } = body;

    if (!name || !category) {
      return NextResponse.json(
        { success: false, error: "Metal name and category are required." },
        { status: 400 }
      );
    }

    const insert = db.prepare(`
      INSERT INTO metals (name, category, default_unit, description)
      VALUES (?, ?, ?, ?)
    `);

    const result = insert.run(name, category, default_unit, description || "");
    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid, name, category, default_unit, description },
    });
  } catch (error: unknown) {
    console.error("Metals POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
