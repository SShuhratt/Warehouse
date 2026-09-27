import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");

    let query = `
      SELECT 
        id,
        service_type,
        client_name,
        client_phone,
        fee_amount,
        service_date,
        description,
        created_at
      FROM service_records
    `;

    if (month && month !== "all") {
      query += ` WHERE strftime('%Y-%m', service_date) = '${month}'`;
    }

    query += ` ORDER BY service_date DESC, id DESC`;

    const services = db.prepare(query).all();

    // Grouping summary by service type
    const summaryByType = db.prepare(`
      SELECT 
        service_type,
        COUNT(*) AS count,
        SUM(fee_amount) AS total_amount
      FROM service_records
      ${month && month !== "all" ? `WHERE strftime('%Y-%m', service_date) = '${month}'` : ""}
      GROUP BY service_type
      ORDER BY total_amount DESC
    `).all();

    return NextResponse.json({
      success: true,
      data: {
        services,
        summary: summaryByType,
      },
    });
  } catch (error: unknown) {
    console.error("Services GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      service_type,
      client_name,
      client_phone,
      fee_amount,
      service_date,
      description,
    } = body;

    const numFee = parseFloat(fee_amount);

    if (!service_type || isNaN(numFee) || numFee <= 0) {
      return NextResponse.json(
        { success: false, error: "Service type and valid fee amount (>0) are required." },
        { status: 400 }
      );
    }

    const date = service_date || new Date().toISOString().split("T")[0];

    const insert = db.prepare(`
      INSERT INTO service_records (service_type, client_name, client_phone, fee_amount, service_date, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      service_type,
      client_name || "Direct Customer",
      client_phone || "",
      numFee,
      date,
      description || ""
    );

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        service_type,
        client_name,
        client_phone,
        fee_amount: numFee,
        service_date: date,
        description,
      },
    });
  } catch (error: unknown) {
    console.error("Services POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
