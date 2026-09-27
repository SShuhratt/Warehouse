import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // 1. Grouped debtors with total debt, active debt sales count, earliest due date
    const debtorsSummary = db.prepare(`
      SELECT 
        buyer_name,
        buyer_phone,
        COUNT(CASE WHEN debt_amount > 0 THEN 1 END) AS active_debts_count,
        SUM(debt_amount) AS total_debt,
        SUM(sale_price) AS total_purchased,
        SUM(payment_amount) AS total_paid,
        MIN(CASE WHEN debt_amount > 0 AND payment_deadline IS NOT NULL THEN payment_deadline END) AS earliest_deadline,
        MIN(CASE WHEN debt_amount > 0 AND payment_deadline IS NOT NULL THEN CAST((julianday(payment_deadline) - julianday('now', 'localtime')) AS INTEGER) END) AS min_days_remaining,
        COUNT(*) AS total_transactions_count
      FROM sales_records
      GROUP BY buyer_name, buyer_phone
      ORDER BY total_debt DESC, min_days_remaining ASC
    `).all();

    // 2. Individual debt sales records with days remaining
    const individualDebts = db.prepare(`
      SELECT 
        s.id AS sale_id,
        s.buyer_name,
        s.buyer_phone,
        s.metal_id,
        m.name AS metal_name,
        s.weight_kg,
        s.sale_price,
        s.payment_amount,
        s.debt_amount,
        s.payment_status,
        s.payment_deadline,
        s.sale_date,
        s.notes,
        CAST((julianday(s.payment_deadline) - julianday('now', 'localtime')) AS INTEGER) AS days_remaining
      FROM sales_records s
      JOIN metals m ON s.metal_id = m.id
      WHERE s.debt_amount > 0
      ORDER BY julianday(s.payment_deadline) ASC, s.sale_date DESC
    `).all();

    // 3. Complete sales transactions history with payment details
    const allTransactions = db.prepare(`
      SELECT 
        s.id AS sale_id,
        s.buyer_name,
        s.buyer_phone,
        m.name AS metal_name,
        s.weight_kg,
        s.sale_price,
        s.payment_amount,
        s.debt_amount,
        s.payment_status,
        s.payment_deadline,
        s.sale_date,
        s.notes
      FROM sales_records s
      JOIN metals m ON s.metal_id = m.id
      ORDER BY s.sale_date DESC, s.id DESC
    `).all();

    return NextResponse.json({
      success: true,
      data: {
        debtors: debtorsSummary,
        individual_debts: individualDebts,
        transactions: allTransactions,
      },
    });
  } catch (error: unknown) {
    console.error("Debtors GET Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// Record an installment payment for a debt
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sale_id, payment_amount, payment_method = "BANK_TRANSFER", notes } = body;

    const numSaleId = parseInt(sale_id, 10);
    const numAmount = parseFloat(payment_amount);

    if (!numSaleId || isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid sale ID and payment amount (>0) are required." },
        { status: 400 }
      );
    }

    const sale = db.prepare("SELECT * FROM sales_records WHERE id = ?").get(numSaleId) as {
      id: number;
      sale_price: number;
      payment_amount: number;
      debt_amount: number;
    } | undefined;

    if (!sale) {
      return NextResponse.json({ success: false, error: "Sale record not found." }, { status: 404 });
    }

    if (sale.debt_amount <= 0) {
      return NextResponse.json({ success: false, error: "This order is already fully paid." }, { status: 400 });
    }

    const newPaymentAmount = sale.payment_amount + numAmount;
    const newDebtAmount = Math.max(0, sale.sale_price - newPaymentAmount);
    const newStatus = newDebtAmount <= 0 ? "PAID" : "PARTIAL";

    // Run transaction
    const updateSale = db.prepare(`
      UPDATE sales_records 
      SET payment_amount = ?, debt_amount = ?, payment_status = ?
      WHERE id = ?
    `);

    const insertPayment = db.prepare(`
      INSERT INTO debt_payments (sale_id, amount, payment_date, payment_method, notes)
      VALUES (?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split("T")[0];

    const runInTransaction = db.transaction(() => {
      updateSale.run(newPaymentAmount, newDebtAmount, newStatus, numSaleId);
      insertPayment.run(numSaleId, numAmount, today, payment_method, notes || "Installment payment");
    });

    runInTransaction();

    return NextResponse.json({
      success: true,
      data: {
        sale_id: numSaleId,
        amount_paid: numAmount,
        total_paid: newPaymentAmount,
        remaining_debt: newDebtAmount,
        status: newStatus,
      },
    });
  } catch (error: unknown) {
    console.error("Debtors Payment POST Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
