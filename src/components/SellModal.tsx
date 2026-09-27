"use client";

import React, { useState } from "react";
import { X, ShoppingBag, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Metal {
  id: number;
  name: string;
  category: string;
  on_hand_kg?: number;
  avg_unit_cost_kg?: number;
}

interface SellModalProps {
  isOpen: boolean;
  onClose: () => void;
  metals: Metal[];
  onSuccess: () => void;
}

export default function SellModal({
  isOpen,
  onClose,
  metals,
  onSuccess,
}: SellModalProps) {
  const { t } = useI18n();

  const [metalId, setMetalId] = useState<string>(metals[0]?.id?.toString() || "");
  const [weight, setWeight] = useState<string>("");
  const [unit, setUnit] = useState<"kg" | "ton">("kg");
  const [salePrice, setSalePrice] = useState<string>("");

  // Buyer details
  const [buyerName, setBuyerName] = useState<string>("");
  const [buyerPhone, setBuyerPhone] = useState<string>("+998 ");

  // Payment details
  const [paymentType, setPaymentType] = useState<"full" | "partial" | "debt">("full");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentDeadline, setPaymentDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  const selectedMetal = metals.find((m) => m.id.toString() === metalId);
  const onHandKg = selectedMetal?.on_hand_kg ?? 0;

  const weightInKg = unit === "ton" ? (parseFloat(weight) || 0) * 1000 : parseFloat(weight) || 0;
  const price = parseFloat(salePrice) || 0;

  let finalPaid = 0;
  if (paymentType === "full") {
    finalPaid = price;
  } else if (paymentType === "debt") {
    finalPaid = 0;
  } else {
    finalPaid = parseFloat(paymentAmount) || 0;
  }
  const remainingDebt = Math.max(0, price - finalPaid);

  const isStockInsufficient = weightInKg > onHandKg;

  const setDeadlinePreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setPaymentDeadline(d.toISOString().split("T")[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!metalId) {
      setErrorMsg("Please select a metal item.");
      return;
    }
    if (weightInKg <= 0) {
      setErrorMsg("Please enter a valid weight greater than 0.");
      return;
    }
    if (isStockInsufficient) {
      setErrorMsg(
        t("insufficientStockWarn", {
          req: weightInKg.toLocaleString(),
          avail: onHandKg.toLocaleString(),
        })
      );
      return;
    }
    if (price <= 0) {
      setErrorMsg("Total sale price must be greater than 0.");
      return;
    }
    if (!buyerName.trim() || !buyerPhone.trim()) {
      setErrorMsg("Buyer name and buyer phone number are required.");
      return;
    }
    if (remainingDebt > 0 && !paymentDeadline) {
      setErrorMsg("Please specify a payment deadline date for the remaining debt.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metal_id: parseInt(metalId, 10),
          weight_kg: weightInKg,
          sale_price: price,
          buyer_name: buyerName.trim(),
          buyer_phone: buyerPhone.trim(),
          payment_amount: finalPaid,
          payment_deadline: remainingDebt > 0 ? paymentDeadline : null,
          sale_date: saleDate,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWeight("");
        setSalePrice("");
        setBuyerName("");
        setBuyerPhone("+998 ");
        setPaymentAmount("");
        setNotes("");
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to record sale.");
      }
    } catch {
      setErrorMsg("Network error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ padding: "28px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            borderBottom: "1px solid #e2e8f0",
            paddingBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#ffedd5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ea580c",
              }}
            >
              <ShoppingBag size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                {t("sellModalTitle")}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {t("sellModalSubtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={22} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              borderRadius: "8px",
              padding: "10px 14px",
              color: "#b91c1c",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "18px",
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Metal Item Select with Live Stock Badge */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="label-title" style={{ marginBottom: 0 }}>
                {t("selectProfileLabel")}
              </label>
              {selectedMetal && (
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: onHandKg > 0 ? "#16a34a" : "#dc2626",
                    fontWeight: 700,
                  }}
                >
                  {t("onHandLabel", { weight: onHandKg.toLocaleString() })}
                </span>
              )}
            </div>
            <select
              value={metalId}
              onChange={(e) => setMetalId(e.target.value)}
              className="input-control"
              required
            >
              {metals.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {t("availableColon", { weight: (m.on_hand_kg ?? 0).toLocaleString() })}
                </option>
              ))}
            </select>
          </div>

          {/* Weight & Unit Toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <div>
              <label className="label-title">{t("soldWeightLabel")}</label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 3500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input-control numeric"
                style={isStockInsufficient ? { borderColor: "#dc2626" } : {}}
                required
              />
            </div>
            <div>
              <label className="label-title">{t("unitLabel")}</label>
              <div
                style={{
                  display: "flex",
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  overflow: "hidden",
                  height: "44px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setUnit("kg")}
                  style={{
                    flex: 1,
                    border: "none",
                    background: unit === "kg" ? "#ea580c" : "transparent",
                    color: unit === "kg" ? "#fff" : "#475569",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  {t("unitKg")}
                </button>
                <button
                  type="button"
                  onClick={() => setUnit("ton")}
                  style={{
                    flex: 1,
                    border: "none",
                    background: unit === "ton" ? "#ea580c" : "transparent",
                    color: unit === "ton" ? "#fff" : "#475569",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  {t("unitTons")}
                </button>
              </div>
            </div>
          </div>

          {isStockInsufficient && (
            <div style={{ fontSize: "0.82rem", color: "#dc2626", fontWeight: 600, marginTop: "-8px" }}>
              ⚠️ {t("insufficientStockWarn", { req: weightInKg.toLocaleString(), avail: onHandKg.toLocaleString() })}
            </div>
          )}

          {/* Sale Price & Unit Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="label-title">{t("totalSalePriceLabel")}</label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 3850"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="input-control numeric"
                required
              />
            </div>
            <div>
              <label className="label-title">{t("effectiveUnitPriceLabel")}</label>
              <div
                className="input-control numeric"
                style={{
                  background: "#f8fafc",
                  color: "#ea580c",
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                }}
              >
                ${weightInKg > 0 && price > 0 ? (price / weightInKg).toFixed(2) : "0.00"} / kg
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
              {t("buyerTGInfo")}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="label-title">{t("buyerFullNameLabel")}</label>
                <input
                  type="text"
                  placeholder="e.g. Rustam Akhmedov (TechnoStroy)"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="input-control"
                  required
                />
              </div>
              <div>
                <label className="label-title">{t("buyerPhoneLabel")}</label>
                <input
                  type="text"
                  placeholder="+998 90 123 45 67"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="input-control numeric"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Terms & Debt Options */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a", marginBottom: "10px" }}>
              {t("paymentDebtTerms")}
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setPaymentType("full")}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "2px solid",
                  borderColor: paymentType === "full" ? "#16a34a" : "#cbd5e1",
                  background: paymentType === "full" ? "#dcfce7" : "#ffffff",
                  color: paymentType === "full" ? "#14532d" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                }}
              >
                {t("fullPaymentBtn", { price: price.toLocaleString() })}
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("partial")}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "2px solid",
                  borderColor: paymentType === "partial" ? "#ea580c" : "#cbd5e1",
                  background: paymentType === "partial" ? "#ffedd5" : "#ffffff",
                  color: paymentType === "partial" ? "#7c2d12" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                }}
              >
                {t("partialPaymentBtn")}
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("debt")}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "2px solid",
                  borderColor: paymentType === "debt" ? "#dc2626" : "#cbd5e1",
                  background: paymentType === "debt" ? "#fee2e2" : "#ffffff",
                  color: paymentType === "debt" ? "#7f1d1d" : "#475569",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                }}
              >
                {t("creditDebtBtn")}
              </button>
            </div>

            {paymentType === "partial" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label className="label-title">{t("downPaymentLabel")}</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max={price}
                    placeholder="e.g. 1500"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="input-control numeric"
                    required
                  />
                </div>
                <div>
                  <label className="label-title">{t("remainingDebtLabel")}</label>
                  <div
                    className="input-control numeric"
                    style={{
                      background: "#fee2e2",
                      color: "#b91c1c",
                      fontWeight: 700,
                    }}
                  >
                    ${remainingDebt.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {remainingDebt > 0 && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="label-title" style={{ marginBottom: 0 }}>
                    {t("paymentDeadlineLabel")}
                  </label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => setDeadlinePreset(7)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "3px 8px", fontSize: "0.78rem" }}
                    >
                      {t("plus7Days")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadlinePreset(14)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "3px 8px", fontSize: "0.78rem" }}
                    >
                      {t("plus14Days")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadlinePreset(30)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: "3px 8px", fontSize: "0.78rem" }}
                    >
                      {t("plus30Days")}
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={paymentDeadline}
                  onChange={(e) => setPaymentDeadline(e.target.value)}
                  className="input-control"
                  required={remainingDebt > 0}
                />
              </div>
            )}
          </div>

          {/* Date & Sale Notes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
            <div>
              <label className="label-title">{t("saleDateLabel")}</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="input-control"
                required
              />
            </div>
            <div>
              <label className="label-title">{t("tgOrderRefLabel")}</label>
              <input
                type="text"
                placeholder="e.g. Invoiced via TG @manager, pickup by 2pm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-control"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t("cancelBtn")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isStockInsufficient}
              className="btn btn-sell"
              style={{ opacity: isSubmitting || isStockInsufficient ? 0.6 : 1 }}
            >
              {isSubmitting ? t("processingSaleBtn") : t("confirmDispatchBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
