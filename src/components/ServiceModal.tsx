"use client";

import React, { useState } from "react";
import { X, Wrench, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SERVICE_TYPE_MAP = {
  uz: [
    "Kesish (Резка / Cutting)",
    "Bukish (Гибка / Bending)",
    "Yetkazib berish (Доставка / Transport)",
    "Kran yuklash (Погрузка / Crane)",
    "Omborda saqlash (Хранение / Storage)",
    "Payvandlash (Сварка / Welding)",
    "Boshqa ishlov berish (Другое / Other)",
  ],
  ru: [
    "Резка (Cutting / Kesish)",
    "Гибка (Bending / Bukish)",
    "Доставка (Transportation / Yetkazish)",
    "Погрузка краном (Crane & Loading)",
    "Хранение металла (Storage Rental)",
    "Сварка и сборка (Welding & Assembly)",
    "Другая обработка (Other)",
  ],
  en: [
    "Cutting (Резка)",
    "Bending (Гибка)",
    "Transportation (Доставка)",
    "Crane & Loading (Погрузка)",
    "Storage Rental (Хранение)",
    "Welding & Assembly (Сварка)",
    "Other Processing (Другое)",
  ],
};

export default function ServiceModal({
  isOpen,
  onClose,
  onSuccess,
}: ServiceModalProps) {
  const { t, language } = useI18n();
  const serviceOptions = SERVICE_TYPE_MAP[language] || SERVICE_TYPE_MAP.en;

  const [serviceType, setServiceType] = useState<string>(serviceOptions[0]);
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("+998 ");
  const [feeAmount, setFeeAmount] = useState<string>("");
  const [serviceDate, setServiceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fee = parseFloat(feeAmount);
    if (isNaN(fee) || fee <= 0) {
      setErrorMsg("Please enter a valid service fee amount greater than 0.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: serviceType,
          client_name: clientName.trim() || "Direct Customer",
          client_phone: clientPhone.trim(),
          fee_amount: fee,
          service_date: serviceDate,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeeAmount("");
        setClientName("");
        setClientPhone("+998 ");
        setDescription("");
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to log service fee.");
      }
    } catch {
      setErrorMsg("Error communicating with server.");
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
                background: "#f3e8ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#7c3aed",
              }}
            >
              <Wrench size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                {t("serviceModalTitle")}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {t("serviceModalSubtitle")}
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
          <div>
            <label className="label-title">{t("serviceCategoryLabel")}</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="input-control"
              required
            >
              {serviceOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="label-title">{t("serviceFeeLabel")}</label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 250"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="input-control numeric"
                required
              />
            </div>
            <div>
              <label className="label-title">{t("dateOfServiceLabel")}</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="input-control"
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="label-title">{t("clientCompanyLabel")}</label>
              <input
                type="text"
                placeholder="e.g. Rustam Akhmedov"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="input-control"
              />
            </div>
            <div>
              <label className="label-title">{t("clientPhoneLabel")}</label>
              <input
                type="text"
                placeholder="+998 90 123 45 67"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                className="input-control numeric"
              />
            </div>
          </div>

          <div>
            <label className="label-title">{t("serviceSpecsLabel")}</label>
            <textarea
              rows={3}
              placeholder="e.g. Plasma cut 4 sheets of 5mm steel into 500x500mm baseplates. Operator: Bobur."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-control"
              style={{ resize: "vertical" }}
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
              {isSubmitting ? t("savingBtn") : t("recordServiceBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
