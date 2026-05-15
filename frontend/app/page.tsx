"use client";

import { useState } from "react";

interface Filing {
  date: string;
  description: string;
  summary: string;
  warning?: boolean;
}

interface Result {
  company: string;
  company_number: string;
  filings: Filing[];
}

const SLUG_MAP: Record<string, string> = {
  "termination-director-company-with-name-termination-date": "Director Termination",
  "appoint-person-as-director-using-self-link": "Director Appointment",
  "capital-return-purchase-own-shares": "Capital Return: Purchase of Own Shares",
  "confirmation-statement-with-no-updates": "Confirmation Statement",
  "confirmation-statement-with-updates": "Confirmation Statement (Updated)",
  "accounts-with-accounts-type-total-exemption-full": "Annual Accounts",
  "accounts-with-accounts-type-full": "Annual Accounts (Full)",
  "change-registered-office-address-company-with-date-old-address-new-address": "Registered Office Address Change",
  "mortgage-satisfy-charge-full": "Mortgage Charge Satisfied",
};

function formatSlug(slug: string): string {
  if (SLUG_MAP[slug]) return SLUG_MAP[slug];
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Section header **ALL CAPS**
    if (/^\*\*[A-Z0-9\s\.\-\/]+\*\*$/.test(line.trim())) {
      const clean = line.replace(/\*\*/g, "");
      return (
        <div key={i} style={{ marginTop: i === 0 ? 0 : "20px", marginBottom: "6px" }}>
          <span style={{ fontSize: "10px", letterSpacing: "0.25em", fontWeight: 600, color: "#d97706", textTransform: "uppercase" }}>{clean}</span>
        </div>
      );
    }
    // Bullet with bold label
    if (/^- \*\*.+\*\*:/.test(line)) {
      const match = line.match(/^- \*\*(.+?)\*\*:\s*(.*)/);
      if (match) {
        return (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "13px" }}>
            <span style={{ color: "#444", flexShrink: 0 }}>·</span>
            <span>
              <span style={{ color: "#bbb", fontWeight: 500 }}>{match[1]}: </span>
              <span style={{ color: "#666" }}>{match[2].replace(/\*\*/g, "")}</span>
            </span>
          </div>
        );
      }
    }
    // Plain bullet
    if (line.startsWith("- ")) {
      return (
        <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px", fontSize: "13px" }}>
          <span style={{ color: "#444", flexShrink: 0 }}>·</span>
          <span style={{ color: "#666" }}>{line.slice(2).replace(/\*\*/g, "")}</span>
        </div>
      );
    }
    // Empty line
    if (line.trim() === "") return <div key={i} style={{ height: "4px" }} />;
    // Default
    return (
      <p key={i} style={{ fontSize: "13px", color: "#666", margin: "0 0 6px 0" }}>
        {line.replace(/\*\*/g, "")}
      </p>
    );
  });
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/analyse?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Could not retrieve filings. Check the company name and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #0c0c0c; margin: 0; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.15; }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.5s ease 0.1s forwards; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.5s ease 0.2s forwards; opacity: 0; }
        .pulse { animation: pulseDot 1.2s ease infinite; }
        .search-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid #1e1e1e;
          color: #e5e5e5;
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          padding: 14px 0;
          width: 100%;
          transition: border-color 0.2s;
        }
        .search-input:focus { outline: none; border-bottom-color: #d97706; }
        .search-input::placeholder { color: #2e2e2e; }
        .filing-card { border-left: 1px solid #1a1a1a; transition: border-left-color 0.25s; padding-left: 20px; }
        .filing-card:hover { border-left-color: #d97706; }
        .analyse-btn {
          background: #d97706;
          color: #0c0c0c;
          border: none;
          padding: 14px 28px;
          font-size: 11px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: 700;
          cursor: pointer;
          font-family: 'DM Mono', monospace;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .analyse-btn:hover { background: #f59e0b; }
        .analyse-btn:disabled { background: #1a1a1a; color: #333; cursor: not-allowed; }
      `}</style>

      <main style={{ background: "#0c0c0c", color: "#e5e5e5", minHeight: "100vh", fontFamily: "'DM Mono', monospace" }}>

        {/* Header */}
        <header style={{ borderBottom: "1px solid #141414", padding: "18px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
            <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "18px", letterSpacing: "-0.02em", color: "#e5e5e5" }}>
              DisclosureLens
            </span>
            <span style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#2a2a2a", textTransform: "uppercase" }}>
              UK Regulatory Intelligence
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#252525", textTransform: "uppercase" }}>
              Companies House · Live Register
            </span>
            <span style={{ fontSize: "9px", border: "1px solid #1a1a1a", padding: "3px 8px", color: "#252525", letterSpacing: "0.1em" }}>
              BETA
            </span>
          </div>
        </header>

        <div style={{ maxWidth: "740px", margin: "0 auto", padding: "72px 40px 100px" }}>

          {/* Hero */}
          <div className="fade-up" style={{ marginBottom: "60px" }}>
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(34px, 5vw, 54px)", lineHeight: 1.05, letterSpacing: "-0.025em", color: "#e5e5e5", margin: "0 0 18px 0", fontWeight: 400 }}>
              UK company filings,<br />
              <em style={{ color: "#555" }}>decoded.</em>
            </h1>
            <p style={{ fontSize: "12px", color: "#3a3a3a", letterSpacing: "0.08em", lineHeight: 1.7, margin: 0 }}>
              Live Companies House data · AI-powered analyst briefs · Any UK registered company
            </p>
          </div>

          {/* Search bar */}
          <div className="fade-up-1" style={{ marginBottom: "72px" }}>
            <label style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#2e2e2e", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>
              Company name
            </label>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
              <input
                className="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="e.g. Tesco, Barclays, BP, Rolls-Royce"
              />
              <button className="analyse-btn" onClick={handleSearch} disabled={loading}>
                {loading ? "Fetching…" : "Analyse →"}
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0 32px" }}>
              <span className="pulse" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#d97706", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#333", textTransform: "uppercase" }}>
                Retrieving filings from Companies House…
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ borderLeft: "2px solid #7f1d1d", padding: "12px 16px", background: "#0d0404", fontSize: "12px", color: "#ef4444", marginBottom: "24px" }}>
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="fade-up">
              {/* Company title */}
              <div style={{ marginBottom: "48px", paddingBottom: "32px", borderBottom: "1px solid #141414" }}>
                <div style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#333", textTransform: "uppercase", marginBottom: "10px" }}>
                  Registered company
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 400, letterSpacing: "-0.015em", color: "#e5e5e5", margin: "0 0 10px 0" }}>
                  {result.company}
                </h2>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
<span style={{ fontSize: "11px", color: "#2e2e2e", letterSpacing: "0.1em" }}>
  CH No. {result.company_number}
</span>
                  <span style={{ color: "#222" }}>·</span>
                  <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: "#252525", textTransform: "uppercase" }}>
                    {result.filings.length} filing{result.filings.length !== 1 ? "s" : ""} analysed
                  </span>
                </div>
              </div>

              {/* Filing cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
                {result.filings.map((filing, i) => (
                  <div
                    key={i}
                    className="filing-card"
                    style={{ opacity: 0, animation: `fadeUp 0.5s ease ${0.1 + i * 0.12}s forwards` }}
                  >
                    {/* Filing header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#333", textTransform: "uppercase", marginBottom: "5px" }}>
                          Filing {i + 1}
                        </div>
                        <div style={{ fontSize: "13px", color: "#777", fontWeight: 500, lineHeight: 1.4 }}>
                          {formatSlug(filing.description)}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginLeft: "20px", textAlign: "right" }}>
                        <span style={{ fontSize: "11px", color: "#2e2e2e", letterSpacing: "0.05em" }}>
                          {formatDate(filing.date)}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
{filing.warning ? (
  <div style={{ padding: "14px 16px", background: "#0f0f0f", border: "1px solid #1a1a1a", fontSize: "11px", color: "#444", letterSpacing: "0.05em", lineHeight: 1.8 }}>
    <div style={{ color: "#555", marginBottom: "4px" }}>
      This filing contains limited extractable text — typically a short statutory form or table-based document.
    </div>
<div style={{ color: "#2e2e2e" }}>
  View the full document on the{" "}
  <a
    href={`https://find-and-update.company-information.service.gov.uk/company/${result.company_number}/filing-history`}
    target="_blank"
    rel="noopener noreferrer"
    style={{ color: "#d97706", textDecoration: "none" }}
  >
    Companies House register →
  </a>
</div>
  </div>
) : (
                      <div style={{ background: "#0f0f0f", border: "1px solid #161616", padding: "22px 24px", lineHeight: 1.7 }}>
                        {renderMarkdown(filing.summary)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && !error && (
            <div className="fade-up-2" style={{ border: "1px dashed #161616", padding: "56px 40px", textAlign: "center" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.25em", color: "#222", textTransform: "uppercase", lineHeight: 2.2 }}>
                Enter any UK registered company name<br />
                to retrieve and analyse its latest filings
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer style={{ borderTop: "1px solid #111", padding: "20px 40px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: "9px", color: "#1e1e1e", letterSpacing: "0.15em" }}>DISCLOSURELENS</span>
          <span style={{ fontSize: "9px", color: "#1e1e1e", letterSpacing: "0.15em" }}>POWERED BY COMPANIES HOUSE API</span>
        </footer>
      </main>
    </>
  );
}