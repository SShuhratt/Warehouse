import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const isVercel = process.env.VERCEL === "1" || process.env.NOW_REGION != null;
const dbDir = isVercel ? "/tmp" : process.cwd();
const dbPath = path.join(dbDir, "steel_factory.db");

// If on Vercel and db doesn't exist in /tmp, copy the seeded one from cwd if present
if (isVercel && !fs.existsSync(dbPath)) {
  const seedDbPath = path.join(process.cwd(), "steel_factory.db");
  if (fs.existsSync(seedDbPath)) {
    try {
      fs.copyFileSync(seedDbPath, dbPath);
    } catch (e) {
      console.warn("Could not copy seed db, will initialize fresh:", e);
    }
  }
}

// Ensure upload directory exists
const uploadDir = isVercel ? path.join("/tmp", "uploads") : path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch {
    // Ignore error
  }
}

// Global reference for Next.js hot-reloading
const globalForDb = global as unknown as { db: Database.Database };

export const db: Database.Database =
  globalForDb.db ||
  new Database(dbPath, {
    // verbose: console.log
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}

// Initialize tables
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS metals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    default_unit TEXT DEFAULT 'kg',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS intake_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal_id INTEGER NOT NULL REFERENCES metals(id) ON DELETE RESTRICT,
    weight_kg REAL NOT NULL,
    acquisition_cost REAL NOT NULL,
    unit_cost_per_kg REAL NOT NULL,
    received_date TEXT NOT NULL,
    supplier TEXT,
    photo_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metal_id INTEGER NOT NULL REFERENCES metals(id) ON DELETE RESTRICT,
    weight_kg REAL NOT NULL,
    sale_price REAL NOT NULL,
    unit_price_per_kg REAL NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_phone TEXT NOT NULL,
    payment_amount REAL NOT NULL,
    debt_amount REAL NOT NULL,
    payment_status TEXT NOT NULL, -- 'PAID', 'PARTIAL', 'DEBT'
    payment_deadline TEXT, -- YYYY-MM-DD
    sale_date TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS debt_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales_records(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_date TEXT NOT NULL,
    payment_method TEXT DEFAULT 'BANK_TRANSFER',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_type TEXT NOT NULL,
    client_name TEXT,
    client_phone TEXT,
    fee_amount REAL NOT NULL,
    service_date TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default metals if empty
const countMetals = db.prepare("SELECT COUNT(*) as count FROM metals").get() as { count: number };
if (countMetals.count === 0) {
  const insertMetal = db.prepare(`
    INSERT INTO metals (name, category, default_unit, description)
    VALUES (@name, @category, @default_unit, @description)
  `);

  const initialMetals = [
    { name: "Billet / Заготовка", category: "Raw Steel", default_unit: "kg", description: "Square & round continuous casting steel billets" },
    { name: "Sheet / Листовой металл", category: "Rolled Flat", default_unit: "kg", description: "Hot rolled and cold rolled carbon steel sheets" },
    { name: "Hexagon / Шестигранник", category: "Special Profiles", default_unit: "kg", description: "Calibrated structural steel hexagon bars" },
    { name: "Rebar / Арматура A500C", category: "Construction", default_unit: "kg", description: "Deformed steel rebar 12-32mm" },
    { name: "Square Tube / Профильная труба", category: "Structural Tubing", default_unit: "kg", description: "Hollow structural section tubing" },
    { name: "Round Bar / Круг стальной", category: "Machining Bar", default_unit: "kg", description: "Standard solid round steel bars" },
    { name: "I-Beam / Двутавр", category: "Heavy Beams", default_unit: "kg", description: "Wide flange structural I-beams" },
    { name: "Angle / Уголок", category: "Angle Iron", default_unit: "kg", description: "Equal and unequal steel angle sections" },
  ];

  for (const m of initialMetals) {
    insertMetal.run(m);
  }

  // Add realistic starter seed data so the user can immediately see analytics & debtors
  const today = new Date();
  const formatD = (d: Date) => d.toISOString().split("T")[0];

  const dMinus20 = new Date(today.getTime() - 20 * 86400000);
  const dMinus15 = new Date(today.getTime() - 15 * 86400000);
  const dMinus10 = new Date(today.getTime() - 10 * 86400000);
  const dMinus5 = new Date(today.getTime() - 5 * 86400000);
  const dMinus2 = new Date(today.getTime() - 2 * 86400000);
  const dPlus1 = new Date(today.getTime() + 1 * 86400000);
  const dPlus3 = new Date(today.getTime() + 3 * 86400000);
  const dPlus7 = new Date(today.getTime() + 7 * 86400000);
  const dOverdue = new Date(today.getTime() - 3 * 86400000);

  // Inflow records
  const insertIntake = db.prepare(`
    INSERT INTO intake_records (metal_id, weight_kg, acquisition_cost, unit_cost_per_kg, received_date, supplier, photo_url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertIntake.run(1, 15000, 10500, 0.70, formatD(dMinus20), "MetallurgProm LLC", "/sample_metal_1.svg", "Batch BP-4491, weighed at truck scales");
  insertIntake.run(2, 8500, 7225, 0.85, formatD(dMinus15), "SeverStal Export", "/sample_metal_2.svg", "High precision 3mm hot-rolled sheets");
  insertIntake.run(3, 4200, 4410, 1.05, formatD(dMinus10), "UralMet Alloy", "/sample_metal_3.svg", "Grade 40X structural hexagon rods");
  insertIntake.run(4, 25000, 17000, 0.68, formatD(dMinus5), "Tashkent Metallurgical", "/sample_metal_4.svg", "A500C 16mm certified construction rebar");
  insertIntake.run(5, 6000, 5700, 0.95, formatD(dMinus2), "TubeMaster Industrial", "/sample_metal_5.svg", "80x80x4mm square pipe consignment");

  // Outflow / Sales records
  const insertSale = db.prepare(`
    INSERT INTO sales_records (metal_id, weight_kg, sale_price, unit_price_per_kg, buyer_name, buyer_phone, payment_amount, debt_amount, payment_status, payment_deadline, sale_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sale 1: Fully paid
  insertSale.run(4, 8000, 6800, 0.85, "Orient Construction Group", "+998 90 123 45 67", 6800, 0, "PAID", null, formatD(dMinus15), "Paid via bank wire transfer");

  // Sale 2: Approaching deadline (tomorrow!)
  insertSale.run(2, 3200, 3520, 1.10, "Rustam Akhmedov (TechnoStroy)", "+998 97 765 43 21", 1520, 2000, "PARTIAL", formatD(dPlus1), formatD(dMinus10), "Agreed 15-day credit, balance due tomorrow");

  // Sale 3: Approaching deadline (in 3 days)
  insertSale.run(3, 1800, 2520, 1.40, "Azizbek Karimov (PromMachine)", "+998 93 555 12 34", 1000, 1520, "PARTIAL", formatD(dPlus3), formatD(dMinus5), "Hexagon 40X batch for CNC machining");

  // Sale 4: Overdue debt!
  insertSale.run(1, 5000, 4750, 0.95, "Sardor Umidov (SteelCraft)", "+998 91 888 99 00", 750, 4000, "PARTIAL", formatD(dOverdue), formatD(dMinus20), "Urgent: payment overdue by 3 days");

  // Sale 5: Active debt with 7 days remaining
  insertSale.run(5, 2500, 3125, 1.25, "Bekzod Nazarov (StroyAlliance)", "+998 94 333 44 55", 1000, 2125, "PARTIAL", formatD(dPlus7), formatD(dMinus2), "Square tubes for warehouse framework");

  // Services records
  const insertService = db.prepare(`
    INSERT INTO service_records (service_type, client_name, client_phone, fee_amount, service_date, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertService.run("Cutting (Резка)", "Rustam Akhmedov", "+998 97 765 43 21", 350, formatD(dMinus15), "CNC Plasma cutting 3mm sheets to custom spec");
  insertService.run("Transportation (Доставка)", "Orient Construction", "+998 90 123 45 67", 480, formatD(dMinus15), "20-ton crane truck freight to Sergeli site");
  insertService.run("Bending (Гибка)", "Azizbek Karimov", "+998 93 555 12 34", 220, formatD(dMinus10), "Hydraulic press brake bending 90-degree flanges");
  insertService.run("Crane & Loading (Погрузка)", "Bekzod Nazarov", "+998 94 333 44 55", 150, formatD(dMinus5), "Overhead gantry crane handling for 2.5t tubes");
}
