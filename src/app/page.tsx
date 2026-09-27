"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Layers,
  ShoppingBag,
  Wrench,
  AlertTriangle,
  Phone,
  ArrowDownRight,
  CheckCircle,
  MessageSquare,
  ChevronRight,
  Plus,
  RefreshCw,
  Eye,
  Camera,
  Scale,
  Building2,
} from "lucide-react";

import { useI18n } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ReceiveModal from "@/components/ReceiveModal";
import SellModal from "@/components/SellModal";
import ServiceModal from "@/components/ServiceModal";
import ServiceDetailsModal from "@/components/ServiceDetailsModal";
import PaymentModal from "@/components/PaymentModal";

interface StatsData {
  sold: {
    weight_kg: number;
    value: number;
    collected: number;
    debt: number;
  };
  intake: {
    weight_kg: number;
    value: number;
  };
  services: {
    total_revenue: number;
    orders_count: number;
    details: Array<{
      id: number;
      service_type: string;
      client_name: string;
      client_phone: string;
      fee_amount: number;
      service_date: string;
      description: string;
    }>;
  };
  stock: {
    on_hand_weight_kg: number;
    estimated_value: number;
  };
  debt: {
    total_active: number;
  };
  notifications: Array<{
    sale_id: number;
    buyer_name: string;
    buyer_phone: string;
    payment_amount: number;
    debt_amount: number;
    sale_price: number;
    payment_deadline: string;
    sale_date: string;
    metal_name: string;
    days_remaining: number;
  }>;
  monthly: Array<{
    month: string;
    total_transactions: number;
    sold_weight: number;
    sold_amount: number;
    collected_amount: number;
    debt_amount: number;
  }>;
}

interface Metal {
  id: number;
  name: string;
  category: string;
  default_unit: string;
  description: string;
  on_hand_kg: number;
  avg_unit_cost_kg: number;
}

interface IntakeRecord {
  id: number;
  metal_id: number;
  metal_name: string;
  metal_category: string;
  weight_kg: number;
  acquisition_cost: number;
  unit_cost_per_kg: number;
  received_date: string;
  supplier: string;
  photo_url?: string;
  notes?: string;
}

interface SaleRecord {
  id: number;
  metal_id: number;
  metal_name: string;
  metal_category: string;
  weight_kg: number;
  sale_price: number;
  unit_price_per_kg: number;
  buyer_name: string;
  buyer_phone: string;
  payment_amount: number;
  debt_amount: number;
  payment_status: string;
  payment_deadline?: string;
  sale_date: string;
  notes?: string;
  days_remaining?: number;
}

interface DebtorSummary {
  buyer_name: string;
  buyer_phone: string;
  active_debts_count: number;
  total_debt: number;
  total_purchased: number;
  total_paid: number;
  earliest_deadline?: string;
  min_days_remaining?: number;
  total_transactions_count: number;
}

export default function DashboardPage() {
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState<"dashboard" | "debtors" | "intake" | "stock">("dashboard");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // Data states
  const [stats, setStats] = useState<StatsData | null>(null);
  const [metals, setMetals] = useState<Metal[]>([]);
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [debtors, setDebtors] = useState<DebtorSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState(false);
  const [paymentModalDebt, setPaymentModalDebt] = useState<any | null>(null);

  // Photo viewer lightbox modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Search filter inside tables
  const [searchFilter, setSearchFilter] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const monthParam = selectedMonth !== "all" ? `?month=${selectedMonth}` : "";
      
      const [resStats, resMetals, resIntakes, resSales, resDebtors] = await Promise.all([
        fetch(`/api/stats${monthParam}`).then((r) => r.json()),
        fetch("/api/metals").then((r) => r.json()),
        fetch("/api/intake?limit=100").then((r) => r.json()),
        fetch(`/api/sales${monthParam}`).then((r) => r.json()),
        fetch("/api/debtors").then((r) => r.json()),
      ]);

      if (resStats.success) setStats(resStats.data);
      if (resMetals.success) setMetals(resMetals.data);
      if (resIntakes.success) setIntakes(resIntakes.data);
      if (resSales.success) setSales(resSales.data);
      if (resDebtors.success) setDebtors(resDebtors.data.debtors);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTelegramUrl = (phone: string) => {
    const digits = phone.replace(/[^0-9]/g, "");
    return `https://t.me/+${digits}`;
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      {/* Top Header Bar */}
      <header
        style={{
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "14px 28px",
        }}
      >
        <div
          style={{
            maxWidth: "1600px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          {/* Logo / Title */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
              }}
            >
              <Building2 size={24} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.01em" }}>
                  {t("appTitle")}
                </h1>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "#dbeafe",
                    color: "#1e40af",
                    fontWeight: 700,
                  }}
                >
                  {t("terminalBadge")}
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
                {t("appSubtitle")}
              </p>
            </div>
          </div>

          {/* Month Filter, Language Switcher & Primary Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Month Filter Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700 }}>
                {t("periodLabel")}
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-control"
                style={{ width: "auto", padding: "7px 12px", fontSize: "0.88rem", background: "#f8fafc" }}
              >
                <option value="all">{t("allRecords")}</option>
                <option value="2026-09">2026-09</option>
                <option value="2026-08">2026-08</option>
                <option value="2026-07">2026-07</option>
              </select>
            </div>

            <button
              onClick={() => fetchData()}
              className="btn btn-secondary btn-sm"
              title={t("refreshTitle")}
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>

            {/* Quick Action: RECEIVE METAL (Incoming) */}
            <button
              id="btn-receive-metal"
              onClick={() => setIsReceiveOpen(true)}
              className="btn btn-receive"
            >
              <Layers size={19} />
              {t("receiveMetalBtn")}
            </button>

            {/* Quick Action: SELL METAL (Outflow) */}
            <button
              id="btn-sell-metal"
              onClick={() => setIsSellOpen(true)}
              className="btn btn-sell"
            >
              <ShoppingBag size={19} />
              {t("sellMetalBtn")}
            </button>

            {/* Quick Action: ADD SERVICE REVENUE */}
            <button
              id="btn-add-service"
              onClick={() => setIsServiceOpen(true)}
              className="btn"
              style={{
                background: "#7c3aed",
                color: "#fff",
                boxShadow: "0 2px 6px rgba(124, 58, 237, 0.25)",
              }}
            >
              <Wrench size={19} />
              {t("addServiceBtn")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ maxWidth: "1600px", margin: "0 auto", padding: "24px 28px", width: "100%", flex: 1 }}>
        {/* ========================================================================= */}
        {/* 1. CORE STATISTICS SECTION (Mass & Value Sold, Received, Services, Stock) */}
        {/* ========================================================================= */}
        <section style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "18px",
            }}
          >
            {/* STAT CARD 1: MASS OF GOODS SOLD (with total value below) */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#c2410c", textTransform: "uppercase" }}>
                    {t("volSold")}
                  </div>
                  <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }} className="numeric">
                    {stats?.sold.weight_kg ? (stats.sold.weight_kg / 1000).toFixed(2) : "0.00"}{" "}
                    <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "#64748b" }}>
                      {t("tons")} ({stats?.sold.weight_kg.toLocaleString() || 0} kg)
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#ffedd5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ea580c",
                  }}
                >
                  <TrendingUp size={24} />
                </div>
              </div>

              {/* Total Value Below */}
              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    {t("totalSalesValue")}
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#c2410c" }} className="numeric">
                    ${stats?.sold.value.toLocaleString() || 0}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    {t("collectedDebt")}
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600 }} className="numeric">
                    <span style={{ color: "#16a34a" }}>${stats?.sold.collected.toLocaleString() || 0}</span> /{" "}
                    <span style={{ color: "#dc2626" }}>${stats?.sold.debt.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STAT CARD 2: MASS OF GOODS RECEIVED (with total value below) */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>
                    {t("volReceived")}
                  </div>
                  <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0f172a", marginTop: "4px" }} className="numeric">
                    {stats?.intake.weight_kg ? (stats.intake.weight_kg / 1000).toFixed(2) : "0.00"}{" "}
                    <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "#64748b" }}>
                      {t("tons")} ({stats?.intake.weight_kg.toLocaleString() || 0} kg)
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#dcfce7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#16a34a",
                  }}
                >
                  <ArrowDownRight size={24} />
                </div>
              </div>

              {/* Total Value Below */}
              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    {t("totalAcqCost")}
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#15803d" }} className="numeric">
                    ${stats?.intake.value.toLocaleString() || 0}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    {t("avgUnitCost")}
                  </div>
                  <div style={{ fontSize: "0.88rem", color: "#475569", fontWeight: 600 }} className="numeric">
                    $
                    {stats?.intake.weight_kg && stats.intake.value
                      ? (stats.intake.value / stats.intake.weight_kg).toFixed(2)
                      : "0.00"}{" "}
                    / kg
                  </div>
                </div>
              </div>
            </div>

            {/* STAT CARD 3: SERVICE REVENUE (with "Details" button) */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>
                    {t("serviceRevenue")}
                  </div>
                  <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#6b21a8", marginTop: "4px" }} className="numeric">
                    ${stats?.services.total_revenue.toLocaleString() || 0}
                  </div>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#f3e8ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#7c3aed",
                  }}
                >
                  <Wrench size={24} />
                </div>
              </div>

              {/* Details Button Section */}
              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 500 }}>
                  {stats?.services.orders_count || 0} {t("serviceJobsCount")}
                </div>
                <button
                  id="btn-service-details"
                  onClick={() => setIsServiceDetailsOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#7c3aed", borderColor: "#d8b4fe" }}
                >
                  {t("detailsBtn")} <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* STAT CARD 4: WAREHOUSE ON-HAND STOCK & ACTIVE DEBTS */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2563eb", textTransform: "uppercase" }}>
                    {t("warehouseStock")}
                  </div>
                  <div style={{ fontSize: "1.9rem", fontWeight: 800, color: "#1d4ed8", marginTop: "4px" }} className="numeric">
                    {stats?.stock.on_hand_weight_kg ? (stats.stock.on_hand_weight_kg / 1000).toFixed(2) : "0.00"}{" "}
                    <span style={{ fontSize: "1.05rem", fontWeight: 600, color: "#64748b" }}>{t("tonsOnHand")}</span>
                  </div>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "#dbeafe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                  }}
                >
                  <Scale size={24} />
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                    {t("activeDebt")}
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#dc2626" }} className="numeric">
                    ${stats?.debt.total_active.toLocaleString() || 0}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("stock")}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#2563eb" }}
                >
                  {t("viewStockCatalog")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. NOTIFICATIONS: APPROACHING PAYMENT DEADLINES (Bright Clean Banner)     */}
        {/* ========================================================================= */}
        <section style={{ marginBottom: "24px" }}>
          <div
            style={{
              padding: "20px 24px",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "14px",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    background: "#fef3c7",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#92400e" }}>
                    {t("notifTitle")}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "#b45309" }}>
                    {t("notifSubtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("debtors")}
                className="btn btn-secondary btn-sm"
                style={{ color: "#92400e", background: "#ffffff", borderColor: "#fde68a" }}
              >
                {t("openDebtorsBtn")} <ChevronRight size={14} />
              </button>
            </div>

            {stats?.notifications && stats.notifications.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                  gap: "12px",
                }}
              >
                {stats.notifications.map((item) => {
                  const isOverdue = item.days_remaining < 0;
                  const isDueToday = item.days_remaining === 0;

                  return (
                    <div
                      key={item.sale_id}
                      style={{
                        background: "#ffffff",
                        border: "1px solid",
                        borderColor: isOverdue ? "#fecdd3" : "#fef3c7",
                        borderRadius: "10px",
                        padding: "14px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
                            {item.buyer_name}
                          </span>
                          {isOverdue ? (
                            <span className="badge badge-urgent">
                              {t("overdueBy", { days: Math.abs(item.days_remaining) })}
                            </span>
                          ) : isDueToday ? (
                            <span className="badge badge-urgent">{t("dueToday")}</span>
                          ) : (
                            <span className="badge badge-partial">{t("dueIn", { days: item.days_remaining })}</span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#475569" }}>
                          <Phone size={13} />
                          <span>{item.buyer_phone}</span>
                        </div>

                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
                          {t("orderLabel")} {item.metal_name} • {t("deadlineLabel")} <strong style={{ color: "#0f172a" }}>{item.payment_deadline}</strong>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#dc2626" }} className="numeric">
                          ${item.debt_amount.toLocaleString()}
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <a
                            href={getTelegramUrl(item.buyer_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 8px", color: "#0284c7" }}
                            title="Telegram"
                          >
                            <MessageSquare size={14} /> {t("chatTG")}
                          </a>
                          <button
                            onClick={() => setPaymentModalDebt(item)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: "4px 10px" }}
                          >
                            {t("payBtn")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: "16px",
                  background: "#dcfce7",
                  borderRadius: "8px",
                  color: "#15803d",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <CheckCircle size={18} />
                <span>{t("allClear")}</span>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. FRIENDLY TAB NAVIGATION (Modern Segmented Pills)                      */}
        {/* ========================================================================= */}
        <div
          style={{
            display: "inline-flex",
            background: "#e2e8f0",
            padding: "4px",
            borderRadius: "12px",
            marginBottom: "20px",
            gap: "4px",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          <button
            onClick={() => setActiveTab("dashboard")}
            style={{
              padding: "10px 18px",
              background: activeTab === "dashboard" ? "#ffffff" : "transparent",
              border: "none",
              borderRadius: "8px",
              color: activeTab === "dashboard" ? "#0f172a" : "#475569",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              boxShadow: activeTab === "dashboard" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <TrendingUp size={16} /> {t("tabMonthly")}
          </button>

          <button
            onClick={() => setActiveTab("debtors")}
            style={{
              padding: "10px 18px",
              background: activeTab === "debtors" ? "#ffffff" : "transparent",
              border: "none",
              borderRadius: "8px",
              color: activeTab === "debtors" ? "#dc2626" : "#475569",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              boxShadow: activeTab === "debtors" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <AlertTriangle size={16} /> {t("tabDebtors")}
          </button>

          <button
            onClick={() => setActiveTab("intake")}
            style={{
              padding: "10px 18px",
              background: activeTab === "intake" ? "#ffffff" : "transparent",
              border: "none",
              borderRadius: "8px",
              color: activeTab === "intake" ? "#16a34a" : "#475569",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              boxShadow: activeTab === "intake" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Camera size={16} /> {t("tabIntake")}
          </button>

          <button
            onClick={() => setActiveTab("stock")}
            style={{
              padding: "10px 18px",
              background: activeTab === "stock" ? "#ffffff" : "transparent",
              border: "none",
              borderRadius: "8px",
              color: activeTab === "stock" ? "#2563eb" : "#475569",
              fontWeight: 700,
              fontSize: "0.9rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              whiteSpace: "nowrap",
              boxShadow: activeTab === "stock" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Layers size={16} /> {t("tabStock")}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: MONTHLY STATISTICS & SALES OUTFLOW LEDGER                           */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div>
            {/* Monthly Summary Cards Table */}
            <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "14px" }}>
                {t("monthlyBreakdownTitle")}
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "12px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colMonth")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colSalesOrders")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colTotalSoldMass")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colGrossSalesVal")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colCollectedCash")}</th>
                      <th style={{ padding: "12px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colCreditDebt")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.monthly && stats.monthly.length > 0 ? (
                      stats.monthly.map((m) => (
                        <tr key={m.month} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 800, color: "#2563eb" }}>
                            {m.month}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#475569" }} className="numeric">
                            {m.total_transactions} {t("ordersUnit")}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#0f172a", fontWeight: 700 }} className="numeric">
                            {(m.sold_weight / 1000).toFixed(2)} {t("tons")} ({m.sold_weight.toLocaleString()} kg)
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#ea580c", fontWeight: 800 }} className="numeric">
                            ${m.sold_amount.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#16a34a", fontWeight: 700 }} className="numeric">
                            ${m.collected_amount.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: m.debt_amount > 0 ? "#dc2626" : "#64748b", fontWeight: 700 }} className="numeric">
                            ${m.debt_amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                          {t("noMonthlyRecords")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Individual Sales Transactions */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                    {t("salesRecordsTitle")}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    {t("salesRecordsSubtitle")}
                  </p>
                </div>
                <div style={{ width: "300px" }}>
                  <input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="input-control"
                    style={{ background: "#f8fafc" }}
                  />
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colDate")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colBuyerContact")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colMetalProfile")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colSoldMass")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colSalePrice")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colPaymentAmount")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", color: "#475569", fontWeight: 700 }}>{t("colStatusDeadline")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", color: "#475569", fontWeight: 700 }}>{t("colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales
                      .filter(
                        (s) =>
                          searchFilter === "" ||
                          s.buyer_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          s.buyer_phone.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          s.metal_name.toLowerCase().includes(searchFilter.toLowerCase())
                      )
                      .map((s) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                            {s.sale_date}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{s.buyer_name}</div>
                            <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Phone size={12} /> {s.buyer_phone}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{s.metal_name}</span>
                            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>${s.unit_price_per_kg.toFixed(2)}/kg</div>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#0f172a", fontWeight: 700 }} className="numeric">
                            {(s.weight_kg / 1000).toFixed(2)} {t("tons")} ({s.weight_kg.toLocaleString()} kg)
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#ea580c", fontWeight: 800 }} className="numeric">
                            ${s.sale_price.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }} className="numeric">
                            <div style={{ color: "#16a34a", fontWeight: 700 }}>
                              ${s.payment_amount.toLocaleString()}
                            </div>
                            {s.debt_amount > 0 && (
                              <div style={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 700 }}>
                                ${s.debt_amount.toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {s.payment_status === "PAID" ? (
                              <span className="badge badge-paid">{t("paidBadge")}</span>
                            ) : s.payment_status === "PARTIAL" ? (
                              <span className="badge badge-partial">{t("partialBadge")}</span>
                            ) : (
                              <span className="badge badge-debt">{t("debtBadge")}</span>
                            )}
                            {s.payment_deadline && (
                              <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "4px" }}>
                                {t("dueColon")} <strong>{s.payment_deadline}</strong>
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                              <a
                                href={getTelegramUrl(s.buyer_phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "4px 8px", color: "#0284c7" }}
                                title="Telegram"
                              >
                                <MessageSquare size={13} />
                              </a>
                              {s.debt_amount > 0 && (
                                <button
                                  onClick={() => setPaymentModalDebt(s)}
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: "4px 10px" }}
                                >
                                  {t("payBtn")}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DEBTORS BOARD & CREDIT REPAYMENT DEADLINES                         */}
        {/* ========================================================================= */}
        {activeTab === "debtors" && (
          <div>
            {/* Top Debtors Aggregated Summary */}
            <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                    {t("debtorsTitle")}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
                    {t("debtorsSubtitle")}
                  </p>
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#dc2626" }}>
                  {t("activeCreditBalance")} ${stats?.debt.total_active.toLocaleString() || 0}
                </div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colClientName")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colPhoneTG")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colTotalInvoiced")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colTotalPaid")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colCurrentDebt")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", color: "#475569", fontWeight: 700 }}>{t("colEarliestDeadline")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", color: "#475569", fontWeight: 700 }}>{t("colTimeRemaining")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", color: "#475569", fontWeight: 700 }}>{t("colQuickActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtors.map((d, idx) => {
                      const isOverdue = (d.min_days_remaining ?? 1) < 0;
                      const isToday = d.min_days_remaining === 0;

                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", fontWeight: 800, color: "#0f172a" }}>
                            {d.buyer_name}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#475569" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Phone size={13} /> {d.buyer_phone}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }} className="numeric">
                            ${d.total_purchased.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: "#16a34a", fontWeight: 700 }} className="numeric">
                            ${d.total_paid.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right", color: d.total_debt > 0 ? "#dc2626" : "#16a34a", fontWeight: 800 }} className="numeric">
                            ${d.total_debt.toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center", color: "#475569" }}>
                            {d.earliest_deadline || "—"}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            {d.total_debt <= 0 ? (
                              <span className="badge badge-paid">{t("settledBadge")}</span>
                            ) : isOverdue ? (
                              <span className="badge badge-urgent">
                                {t("overdueDays", { days: Math.abs(d.min_days_remaining ?? 0) })}
                              </span>
                            ) : isToday ? (
                              <span className="badge badge-urgent">{t("dueToday")}</span>
                            ) : (
                              <span className="badge badge-partial">
                                {t("daysRemaining", { days: d.min_days_remaining ?? 0 })}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "center" }}>
                            <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                              <a
                                href={getTelegramUrl(d.buyer_phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: "4px 8px", color: "#0284c7" }}
                                title="Telegram"
                              >
                                <MessageSquare size={13} /> {t("chatTG")}
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-section: Complete Sales Transactions Ledger */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", marginBottom: "14px" }}>
                {t("subLedgerTitle")}
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colOrderId")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colDate")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colBuyerContact")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colMetalProfile")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colWeightSold")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colTotalOrder")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colPaidAmount")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colRemainingDebt")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", color: "#475569", fontWeight: 700 }}>{t("colPaymentDeadline")}</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", color: "#475569", fontWeight: 700 }}>{t("colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s) => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontFamily: "monospace" }}>
                          #{s.id}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#475569" }}>{s.sale_date}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ color: "#0f172a", fontWeight: 700 }}>{s.buyer_name}</div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{s.buyer_phone}</div>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#0f172a", fontWeight: 600 }}>{s.metal_name}</td>
                        <td style={{ padding: "12px 14px", textAlign: "right", fontWeight: 700 }} className="numeric">
                          {s.weight_kg.toLocaleString()} kg
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: "#ea580c", fontWeight: 800 }} className="numeric">
                          ${s.sale_price.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: "#16a34a", fontWeight: 700 }} className="numeric">
                          ${s.payment_amount.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: s.debt_amount > 0 ? "#dc2626" : "#64748b", fontWeight: 800 }} className="numeric">
                          ${s.debt_amount.toLocaleString()}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center", color: "#475569" }}>
                          {s.payment_deadline || t("settledBadge")}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          {s.debt_amount > 0 ? (
                            <button
                              onClick={() => setPaymentModalDebt(s)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: "4px 10px" }}
                            >
                              {t("collectBtn")}
                            </button>
                          ) : (
                            <span style={{ color: "#16a34a", fontSize: "0.8rem", fontWeight: 700 }}>{t("settledBadge")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: INTAKE LOG & PHOTOGRAPHIC EVIDENCE                                */}
        {/* ========================================================================= */}
        {activeTab === "intake" && (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                  {t("intakeLogTitle")}
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  {t("intakeLogSubtitle")}
                </p>
              </div>
              <button
                onClick={() => setIsReceiveOpen(true)}
                className="btn btn-receive"
              >
                <Plus size={16} /> {t("newIntakeBtn")}
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                gap: "18px",
              }}
            >
              {intakes.map((batch) => (
                <div
                  key={batch.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {/* Photo Display / Lightbox trigger */}
                  <div
                    style={{
                      height: "190px",
                      position: "relative",
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: batch.photo_url ? "pointer" : "default",
                      overflow: "hidden",
                    }}
                    onClick={() => batch.photo_url && setPreviewPhoto(batch.photo_url)}
                  >
                    {batch.photo_url ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={batch.photo_url}
                          alt="Scale evidence"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: "8px",
                            right: "8px",
                            padding: "4px 8px",
                            background: "rgba(15, 23, 42, 0.8)",
                            borderRadius: "6px",
                            color: "#fff",
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <Eye size={12} /> {t("viewFullPhoto")}
                        </div>
                      </>
                    ) : (
                      <div style={{ color: "#94a3b8", textAlign: "center", fontSize: "0.85rem" }}>
                        <Camera size={32} style={{ marginBottom: "6px", opacity: 0.4 }} />
                        <div>{t("noPhotoAttached")}</div>
                      </div>
                    )}

                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        background: "#16a34a",
                        color: "#fff",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {batch.metal_category}
                    </div>
                  </div>

                  {/* Batch Details */}
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                          {batch.metal_name}
                        </h4>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          {batch.received_date}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                            {t("intakeMass")}
                          </div>
                          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }} className="numeric">
                            {(batch.weight_kg / 1000).toFixed(2)} {t("tons")} ({batch.weight_kg.toLocaleString()} kg)
                          </div>
                        </div>

                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                            {t("acqCost")}
                          </div>
                          <div style={{ fontSize: "1rem", fontWeight: 800, color: "#16a34a" }} className="numeric">
                            ${batch.acquisition_cost.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: "0.82rem", color: "#475569", marginBottom: "4px" }}>
                        {t("supplierLabel")} <strong style={{ color: "#0f172a" }}>{batch.supplier || "Warehouse Intake"}</strong>
                      </div>

                      {batch.notes && (
                        <div style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>
                          &ldquo;{batch.notes}&rdquo;
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: "1px solid #f1f5f9", marginTop: "12px", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        {t("costBasis")} ${batch.unit_cost_per_kg.toFixed(2)}/kg
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "#2563eb", fontWeight: 700 }}>
                        {t("batchLabel")} #{batch.id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVE WAREHOUSE STOCK CATALOG                                      */}
        {/* ========================================================================= */}
        {activeTab === "stock" && (
          <div className="glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                  {t("stockCatalogTitle")}
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  {t("stockCatalogSubtitle")}
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setIsReceiveOpen(true)} className="btn btn-receive btn-sm">
                  {t("plusIntake")}
                </button>
                <button onClick={() => setIsSellOpen(true)} className="btn btn-sell btn-sm">
                  {t("plusSell")}
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colMetalProfile")}</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colCategory")}</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colTotalReceived")}</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colTotalSold")}</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colOnHandStock")}</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colAvgCostKg")}</th>
                    <th style={{ padding: "10px 14px", textAlign: "center", color: "#475569", fontWeight: 700 }}>{t("colStatus")}</th>
                  </tr>
                </thead>
                <tbody>
                  {metals.map((m) => {
                    const isLow = m.on_hand_kg <= 2000;
                    return (
                      <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#0f172a" }}>
                          {m.name}
                          {m.description && (
                            <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 400 }}>
                              {m.description}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#475569" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "4px",
                              background: "#e0f2fe",
                              color: "#0369a1",
                              fontSize: "0.78rem",
                              fontWeight: 600,
                            }}
                          >
                            {m.category}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: "#475569" }} className="numeric">
                          {((m as any).total_received_kg / 1000).toFixed(2)} {t("tons")}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: "#475569" }} className="numeric">
                          {((m as any).total_sold_kg / 1000).toFixed(2)} {t("tons")}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: "#0f172a", fontWeight: 800, fontSize: "1rem" }} className="numeric">
                          {(m.on_hand_kg / 1000).toFixed(2)} {t("tons")} ({m.on_hand_kg.toLocaleString()} kg)
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "right", color: "#2563eb", fontWeight: 700 }} className="numeric">
                          ${m.avg_unit_cost_kg.toFixed(2)}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          {m.on_hand_kg > 0 ? (
                            isLow ? (
                              <span className="badge badge-partial">{t("lowStock")}</span>
                            ) : (
                              <span className="badge badge-paid">{t("inStock")}</span>
                            )
                          ) : (
                            <span className="badge badge-debt">{t("outOfStock")}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "16px 28px",
          color: "#64748b",
          fontSize: "0.82rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          {t("footerDesc")}
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          {t("footerEngines")}
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS SECTION                                                            */}
      {/* ========================================================================= */}
      {/* 1. Receive Metal Modal */}
      <ReceiveModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        metals={metals}
        onSuccess={fetchData}
      />

      {/* 2. Sell Metal Modal */}
      <SellModal
        isOpen={isSellOpen}
        onClose={() => setIsSellOpen(false)}
        metals={metals}
        onSuccess={fetchData}
      />

      {/* 3. Add Service Revenue Modal */}
      <ServiceModal
        isOpen={isServiceOpen}
        onClose={() => setIsServiceOpen(false)}
        onSuccess={fetchData}
      />

      {/* 4. Service Revenue Details Modal */}
      <ServiceDetailsModal
        isOpen={isServiceDetailsOpen}
        onClose={() => setIsServiceDetailsOpen(false)}
        services={stats?.services.details || []}
        totalRevenue={stats?.services.total_revenue || 0}
      />

      {/* 5. Payment Modal */}
      <PaymentModal
        isOpen={!!paymentModalDebt}
        onClose={() => setPaymentModalDebt(null)}
        debtItem={paymentModalDebt}
        onSuccess={fetchData}
      />

      {/* 6. Photo Lightbox Modal */}
      {previewPhoto && (
        <div className="modal-overlay" onClick={() => setPreviewPhoto(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "900px", padding: "18px", background: "#ffffff" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 700 }}>
                {t("scaleEvidenceTitle")}
              </span>
              <button
                onClick={() => setPreviewPhoto(null)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1.2rem", padding: "4px" }}
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt="Evidence full view"
              style={{ width: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
