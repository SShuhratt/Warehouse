import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const month = searchParams.get("month"); // e.g. "2026-09"
    const buyerPhone = searchParams.get("phone");

    let query = `
      SELECT 
        s.id,
        s.metal_id,
        m.name AS metal_name,
        m.category AS metal_category,
        s.weight_kg,
        s.sale_price,
        s.unit_price_per_kg,
        s.buyer_name,
        s.buyer_phone,
        s.payment_amount,
        s.debt_amount,
        s.payment_status,
        s.payment_deadline,
        s.sale_date,
        s.notes,
        s.created_at,
        CAST((julianday(s.payment_deadline) - julianday('now', 'localtime')) AS INTEGER) AS days_remaining
      FROM sales_records s
      JOIN metals m ON s.metal_id = m.id
      WHERE 1=1
    `;

    if (month && month !== "all") {
      query += ` AND strftime('%Y-%m', s.sale_date) = '${month}'`;
    }

    if (buyerPhone) {
      query += ` AND s.buyer_phone LIKE '%${buyerPhone}%'`;
    }

    query += ` ORDER BY s.sale_date DESC, s.id DESC LIMIT ${limit}`;

    const sales = db.prepare(query).all();
    return NextResponse.json({ success: true, data: sales });
  } catch (error: unknown) {
    console.error("Sales GET Error:", error);
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
      sale_price,
      buyer_name,
      buyer_phone,
      payment_amount = 0,
      payment_deadline,
      sale_date,
      notes,
    } = body;

    const numMetalId = parseInt(metal_id, 10);
    const numWeight = parseFloat(weight_kg);
    const numPrice = parseFloat(sale_price);
    const numPaid = Math.max(0, parseFloat(payment_amount) || 0);

    if (!numMetalId || isNaN(numWeight) || numWeight <= 0 || isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid metal type, weight (>0), and total sale price (>0) are required." },
        { status: 400 }
      );
    }

    if (!buyer_name || !buyer_phone) {
      return NextResponse.json(
        { success: false, error: "Buyer name and buyer phone number are required." },
        { status: 400 }
      );
    }

    // Edge Case Validation: Check on-hand stock
    const stockCheck = db.prepare(`
      SELECT 
        (COALESCE((SELECT SUM(weight_kg) FROM intake_records WHERE metal_id = ?), 0) - 
         COALESCE((SELECT SUM(weight_kg) FROM sales_records WHERE metal_id = ?), 0)) AS on_hand_kg,
        name
      FROM metals
      WHERE id = ?
    `).get(numMetalId, numMetalId, numMetalId) as { on_hand_kg: number; name: string } | undefined;

    if (!stockCheck) {
      return NextResponse.json({ success: false, error: "Selected metal does not exist." }, { status: 404 });
    }

    if (stockCheck.on_hand_kg < numWeight) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient stock for ${stockCheck.name}. On-hand: ${stockCheck.on_hand_kg.toLocaleString()} kg, Requested: ${numWeight.toLocaleString()} kg.`,
        },
        { status: 400 }
      );
    }

    const unitPrice = numWeight > 0 ? numPrice / numWeight : 0;
    const debtAmount = Math.max(0, numPrice - numPaid);
    const paymentStatus = debtAmount <= 0 ? "PAID" : numPaid > 0 ? "PARTIAL" : "DEBT";
    const date = sale_date || new Date().toISOString().split("T")[0];

    const insert = db.prepare(`
      INSERT INTO sales_records (
        metal_id, weight_kg, sale_price, unit_price_per_kg,
        buyer_name, buyer_phone, payment_amount, debt_amount,
        payment_status, payment_deadline, sale_date, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      numMetalId,
      numWeight,
      numPrice,
      unitPrice,
      buyer_name.trim(),
      buyer_phone.trim(),
      numPaid,
      debtAmount,
      paymentStatus,
      debtAmount > 0 ? payment_deadline || null : null,
      date,
      notes || ""
    );

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        metal_id: numMetalId,
        weight_kg: numWeight,
        sale_price: numPrice,
        unit_price_per_kg: unitPrice,
        buyer_name,
        buyer_phone,
        payment_amount: numPaid,
        debt_amount: debtAmount,
        payment_status: paymentStatus,
        payment_deadline: debtAmount > 0 ? payment_deadline : null,
        sale_date: date,
        notes,
      },
    });
  } catch (error: unknown) {
    console.error("Sales POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
