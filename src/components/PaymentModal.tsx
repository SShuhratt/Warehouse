"use client";

import React, { useState } from "react";
import { X, CreditCard, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface DebtItem {
  sale_id: number;
  buyer_name: string;
  buyer_phone: string;
  metal_name: string;
  sale_price: number;
  payment_amount: number;
  debt_amount: number;
  payment_deadline?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtItem: DebtItem | null;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  debtItem,
  onSuccess,
}: PaymentModalProps) {
  const { t } = useI18n();

  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("BANK_TRANSFER");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen || !debtItem) return null;

  const maxPayable = debtItem.debt_amount;

  const handlePayFull = () => {
    setAmount(maxPayable.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg("Please enter a valid payment amount greater than 0.");
      return;
    }
    if (numAmount > maxPayable) {
      setErrorMsg(`Amount cannot exceed the total outstanding debt ($${maxPayable.toLocaleString()}).`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/debtors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sale_id: debtItem.sale_id,
          payment_amount: numAmount,
          payment_method: paymentMethod,
          notes: notes.trim() || `Debt payment by ${debtItem.buyer_name}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAmount("");
        setNotes("");
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to record payment.");
      }
    } catch {
      setErrorMsg("Network error communicating with server.");
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
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb",
              }}
            >
              <CreditCard size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                {t("paymentModalTitle")}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {t("paymentModalSubtitle", {
                  name: debtItem.buyer_name,
                  phone: debtItem.buyer_phone,
                })}
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

        {/* Debt Snapshot */}
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "18px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                {t("totalOrderLabel")}
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }} className="numeric">
                ${(debtItem.sale_price || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                {t("alreadyPaidLabel")}
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#16a34a" }} className="numeric">
                ${((debtItem.payment_amount ?? (debtItem.sale_price - debtItem.debt_amount)) || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>
                {t("outstandingDebtLabel")}
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#dc2626" }} className="numeric">
                ${(debtItem.debt_amount || 0).toLocaleString()}
              </div>
            </div>
          </div>
          {debtItem.payment_deadline && (
            <div style={{ marginTop: "12px", textAlign: "center", fontSize: "0.85rem", color: "#d97706", fontWeight: 600 }}>
              {t("paymentDueDateLabel", { date: debtItem.payment_deadline })}
            </div>
          )}
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
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="label-title" style={{ marginBottom: 0 }}>
                {t("paymentAmountLabel")}
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {t("payFullBalance", { amount: maxPayable.toLocaleString() })}
              </button>
            </div>
            <input
              type="number"
              step="any"
              min="0.01"
              max={maxPayable}
              placeholder="e.g. 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-control numeric"
              required
            />
          </div>

          <div>
            <label className="label-title">{t("paymentMethodLabel")}</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-control"
            >
              <option value="BANK_TRANSFER">{t("methodBankWire")}</option>
              <option value="CASH">{t("methodCash")}</option>
              <option value="CARD">{t("methodCard")}</option>
            </select>
          </div>

          <div>
            <label className="label-title">{t("paymentNotesIdLabel")}</label>
            <input
              type="text"
              placeholder="e.g. Bank payment order #5512 received"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-control"
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t("cancelBtn")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
            >
              {isSubmitting ? t("recordingBtn") : t("confirmPaymentBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
