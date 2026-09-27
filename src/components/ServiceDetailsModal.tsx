"use client";

import React, { useState } from "react";
import { X, Wrench } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ServiceRecord {
  id: number;
  service_type: string;
  client_name: string;
  client_phone: string;
  fee_amount: number;
  service_date: string;
  description: string;
}

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceRecord[];
  totalRevenue: number;
}

export default function ServiceDetailsModal({
  isOpen,
  onClose,
  services,
  totalRevenue,
}: ServiceDetailsModalProps) {
  const { t } = useI18n();
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const filtered = services.filter((s) => {
    const matchesType = filterType === "all" || s.service_type.toLowerCase().includes(filterType.toLowerCase());
    const matchesSearch =
      searchQuery === "" ||
      s.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.client_phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.service_type?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "800px", padding: "28px" }}
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
                {t("serviceDetailsTitle")}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                {t("serviceGrossSummary", {
                  total: totalRevenue.toLocaleString(),
                  count: services.length,
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

        {/* Filters */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <input
              type="text"
              placeholder={t("searchServicePrompt")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-control"
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="input-control"
            >
              <option value="all">{t("allServiceCategories")}</option>
              <option value="Cutting">Cutting / Резка / Kesish</option>
              <option value="Bending">Bending / Гибка / Bukish</option>
              <option value="Transportation">Transportation / Доставка / Yetkazish</option>
              <option value="Crane">Crane & Loading / Погрузка / Yuklash</option>
              <option value="Storage">Storage / Хранение / Saqlash</option>
            </select>
          </div>
        </div>

        {/* Table list */}
        <div
          style={{
            maxHeight: "450px",
            overflowY: "auto",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              {t("noServicesFound")}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colDate")}</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colService")}</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colClientPhone")}</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 700 }}>{t("colDetailsNotes")}</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", color: "#475569", fontWeight: 700 }}>{t("colFeeAmount")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "12px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                      {s.service_date}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700, color: "#0f172a" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 9px",
                          borderRadius: "6px",
                          background: "#f3e8ff",
                          color: "#6b21a8",
                          border: "1px solid #e9d5ff",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        }}
                      >
                        {s.service_type}
                      </span>
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <div style={{ color: "#0f172a", fontWeight: 600 }}>{s.client_name || "Direct Customer"}</div>
                      {s.client_phone && (
                        <div style={{ color: "#64748b", fontSize: "0.8rem" }}>
                          {s.client_phone}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#475569", maxWidth: "250px" }}>
                      {s.description || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        textAlign: "right",
                        color: "#15803d",
                        fontWeight: 700,
                      }}
                      className="numeric"
                    >
                      ${s.fee_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button onClick={onClose} className="btn btn-secondary">
            {t("closeBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}
