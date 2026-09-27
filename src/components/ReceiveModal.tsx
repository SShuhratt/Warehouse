"use client";

import React, { useState, useRef } from "react";
import { X, Camera, CheckCircle2, AlertCircle, Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Metal {
  id: number;
  name: string;
  category: string;
  on_hand_kg?: number;
}

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  metals: Metal[];
  onSuccess: () => void;
}

export default function ReceiveModal({
  isOpen,
  onClose,
  metals,
  onSuccess,
}: ReceiveModalProps) {
  const { t } = useI18n();

  const [metalId, setMetalId] = useState<string>(metals[0]?.id?.toString() || "");
  const [weight, setWeight] = useState<string>("");
  const [unit, setUnit] = useState<"kg" | "ton">("kg");
  const [acquisitionCost, setAcquisitionCost] = useState<string>("");
  const [receivedDate, setReceivedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [supplier, setSupplier] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Photo upload states
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const weightInKg =
    unit === "ton" ? (parseFloat(weight) || 0) * 1000 : parseFloat(weight) || 0;
  const cost = parseFloat(acquisitionCost) || 0;
  const unitCostPerKg = weightInKg > 0 ? (cost / weightInKg).toFixed(2) : "0.00";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setPhotoUrl(data.url);
      } else {
        setErrorMsg(data.error || "Failed to upload photo evidence.");
      }
    } catch {
      setErrorMsg("Network error uploading photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metalId) {
      setErrorMsg("Please select a metal type.");
      return;
    }
    if (weightInKg <= 0) {
      setErrorMsg("Please enter a valid weight greater than 0.");
      return;
    }
    if (cost < 0) {
      setErrorMsg("Acquisition cost cannot be negative.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metal_id: parseInt(metalId, 10),
          weight_kg: weightInKg,
          acquisition_cost: cost,
          received_date: receivedDate,
          supplier: supplier.trim() || "Warehouse Intake Scales",
          photo_url: photoUrl || null,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWeight("");
        setAcquisitionCost("");
        setSupplier("");
        setNotes("");
        setPhotoUrl("");
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || "Failed to record metal intake.");
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
                background: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16a34a",
              }}
            >
              <Layers size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                {t("receiveModalTitle")}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {t("receiveModalSubtitle")}
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
          {/* Metal Type */}
          <div>
            <label className="label-title">{t("metalCategoryLabel")}</label>
            <select
              value={metalId}
              onChange={(e) => setMetalId(e.target.value)}
              className="input-control"
              required
            >
              <option value="" disabled>
                {t("selectMetalPrompt")}
              </option>
              {metals.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category})
                </option>
              ))}
            </select>
          </div>

          {/* Weight & Unit Toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
            <div>
              <label className="label-title">{t("weightMeasuredLabel")}</label>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 15000"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="input-control numeric"
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
                    background: unit === "kg" ? "#16a34a" : "transparent",
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
                    background: unit === "ton" ? "#16a34a" : "transparent",
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

          {unit === "ton" && weight && (
            <div style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 600, marginTop: "-8px" }}>
              {t("storedInLedger", { weight: weightInKg.toLocaleString() })}
            </div>
          )}

          {/* Acquisition Cost */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="label-title">{t("totalAcqCostLabel")}</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 10500"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                className="input-control numeric"
                required
              />
            </div>
            <div>
              <label className="label-title">{t("calcUnitCostLabel")}</label>
              <div
                className="input-control numeric"
                style={{
                  background: "#f8fafc",
                  color: "#0369a1",
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 700,
                }}
              >
                ${unitCostPerKg} / kg
              </div>
            </div>
          </div>

          {/* Photographic Evidence Section */}
          <div>
            <label className="label-title">{t("photoEvidenceLabel")}</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: "none" }}
            />

            {!photoUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed #94a3b8",
                  borderRadius: "10px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#f8fafc",
                  transition: "all 0.2s ease",
                }}
              >
                {isUploading ? (
                  <div style={{ color: "#2563eb", fontSize: "0.9rem", fontWeight: 600 }}>
                    {t("uploadingPhoto")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "#e0f2fe",
                        color: "#0284c7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Camera size={22} />
                    </div>
                    <span style={{ fontSize: "0.9rem", color: "#1e293b", fontWeight: 600 }}>
                      {t("clickToUpload")}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      {t("photoSupportHint")}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px",
                  borderRadius: "10px",
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="Proof preview"
                  style={{
                    width: "70px",
                    height: "50px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#15803d", fontSize: "0.88rem", fontWeight: 700 }}>
                    <CheckCircle2 size={16} /> {t("photoAttached")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="btn btn-secondary btn-sm"
                  style={{ color: "#dc2626" }}
                >
                  {t("removePhoto")}
                </button>
              </div>
            )}
          </div>

          {/* Supplier and Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className="label-title">{t("supplierPlantLabel")}</label>
              <input
                type="text"
                placeholder="e.g. SeverStal, MetallurgProm"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="input-control"
              />
            </div>
            <div>
              <label className="label-title">{t("intakeDateLabel")}</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="input-control"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-title">{t("batchNotesLabel")}</label>
            <input
              type="text"
              placeholder="e.g. Mill test certificate #8849, truck tag 01 A 777 AA"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-control"
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              {t("cancelBtn")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="btn btn-receive"
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? t("recordingBtn") : t("confirmIntakeBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
