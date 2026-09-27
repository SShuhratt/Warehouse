import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // e.g. "2026-09" or "all"

    // Base query conditions if filtering by month
    const saleMonthFilter = month && month !== "all" ? `WHERE strftime('%Y-%m', sale_date) = '${month}'` : "";
    const intakeMonthFilter = month && month !== "all" ? `WHERE strftime('%Y-%m', received_date) = '${month}'` : "";
    const serviceMonthFilter = month && month !== "all" ? `WHERE strftime('%Y-%m', service_date) = '${month}'` : "";

    // 1. Mass and value of goods sold
    const soldStats = db.prepare(`
      SELECT 
        COALESCE(SUM(weight_kg), 0) AS total_sold_weight,
        COALESCE(SUM(sale_price), 0) AS total_sold_value,
        COALESCE(SUM(payment_amount), 0) AS total_collected_cash,
        COALESCE(SUM(debt_amount), 0) AS total_debt_generated
      FROM sales_records
      ${saleMonthFilter}
    `).get() as { total_sold_weight: number; total_sold_value: number; total_collected_cash: number; total_debt_generated: number };

    // 2. Mass and value of goods received
    const intakeStats = db.prepare(`
      SELECT 
        COALESCE(SUM(weight_kg), 0) AS total_received_weight,
        COALESCE(SUM(acquisition_cost), 0) AS total_acquisition_cost
      FROM intake_records
      ${intakeMonthFilter}
    `).get() as { total_received_weight: number; total_acquisition_cost: number };

    // 3. Service revenue
    const serviceStats = db.prepare(`
      SELECT 
        COALESCE(SUM(fee_amount), 0) AS total_service_revenue,
        COUNT(*) AS total_service_orders
      FROM service_records
      ${serviceMonthFilter}
    `).get() as { total_service_revenue: number; total_service_orders: number };

    // 4. Overall live stock inventory (regardless of month filter)
    const stockStats = db.prepare(`
      SELECT 
        (COALESCE((SELECT SUM(weight_kg) FROM intake_records), 0) - 
         COALESCE((SELECT SUM(weight_kg) FROM sales_records), 0)) AS on_hand_weight,
        (COALESCE((SELECT SUM(acquisition_cost) FROM intake_records), 0) - 
         COALESCE((SELECT SUM(sr.weight_kg * (ir.acquisition_cost / ir.weight_kg)) 
                   FROM sales_records sr 
                   LEFT JOIN intake_records ir ON sr.metal_id = ir.metal_id), 0)) AS estimated_stock_value
    `).get() as { on_hand_weight: number; estimated_stock_value: number };

    // 5. Total outstanding debt currently active across all time
    const overallDebt = db.prepare(`
      SELECT 
        COALESCE(SUM(debt_amount), 0) as total_active_debt
      FROM sales_records
      WHERE debt_amount > 0
    `).get() as { total_active_debt: number };

    // 6. Notifications: Clients with approaching payment deadlines (<= 5 days or overdue)
    // SQLite date calculations
    const notifications = db.prepare(`
      SELECT 
        s.id AS sale_id,
        s.buyer_name,
        s.buyer_phone,
        s.payment_amount,
        s.debt_amount,
        s.sale_price,
        s.payment_deadline,
        s.sale_date,
        m.name AS metal_name,
        CAST((julianday(s.payment_deadline) - julianday('now', 'localtime')) AS INTEGER) AS days_remaining
      FROM sales_records s
      JOIN metals m ON s.metal_id = m.id
      WHERE s.debt_amount > 0 AND s.payment_deadline IS NOT NULL
      ORDER BY julianday(s.payment_deadline) ASC
      LIMIT 10
    `).all();

    // 7. Monthly aggregated statistics table (for the monthly breakdown requirement)
    const monthlySales = db.prepare(`
      SELECT 
        strftime('%Y-%m', sale_date) AS month,
        COUNT(*) AS total_transactions,
        SUM(weight_kg) AS sold_weight,
        SUM(sale_price) AS sold_amount,
        SUM(payment_amount) AS collected_amount,
        SUM(debt_amount) AS debt_amount
      FROM sales_records
      GROUP BY strftime('%Y-%m', sale_date)
      ORDER BY month DESC
    `).all();

    // 8. Service breakdown items (for the "Details" button in service revenue)
    const serviceDetails = db.prepare(`
      SELECT 
        id,
        service_type,
        client_name,
        client_phone,
        fee_amount,
        service_date,
        description
      FROM service_records
      ${serviceMonthFilter}
      ORDER BY service_date DESC
    `).all();

    return NextResponse.json({
      success: true,
      data: {
        sold: {
          weight_kg: soldStats.total_sold_weight,
          value: soldStats.total_sold_value,
          collected: soldStats.total_collected_cash,
          debt: soldStats.total_debt_generated,
        },
        intake: {
          weight_kg: intakeStats.total_received_weight,
          value: intakeStats.total_acquisition_cost,
        },
        services: {
          total_revenue: serviceStats.total_service_revenue,
          orders_count: serviceStats.total_service_orders,
          details: serviceDetails,
        },
        stock: {
          on_hand_weight_kg: Math.max(0, stockStats.on_hand_weight),
          estimated_value: Math.max(0, stockStats.estimated_stock_value || 0),
        },
        debt: {
          total_active: overallDebt.total_active_debt,
        },
        notifications,
        monthly: monthlySales,
      },
    });
  } catch (error: unknown) {
    console.error("Stats API Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
