"use client";

import { useState, useEffect } from "react";
import "./globals.css";

interface Company {
  title: string;
  company_number: string;
  company_status: string;
  company_type: string;
  date_of_creation: string;
  address: string;
}

interface Filing {
  date: string;
  description: string;
  category: string;
  type: string;
  summary: string;
  warning?: boolean;
}

interface FilingsResult {
  company: string;
  company_number: string;
  filings: Filing[];
}

interface AnnualReport {
  found: boolean;
  date?: string;
  type?: string;
  summary?: string | null;
  warning?: boolean;
  message?: string;
  company_number?: string;
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

const CATEGORY_LABELS: Record<string, string> = {
  officers: "Officers",
  "capital-and-shareholders": "Capital",
  accounts: "Accounts",
  "confirmation-statement": "Confirmation",
  address: "Address",
  mortgage: "Charges",
  "persons-with-significant-control": "PSC",
  "annual-return": "Annual Return",
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

function formatCompanyType(type: string): string {
  const map: Record<string, string> = {
    plc: "Public Limited Company",
    ltd: "Private Limited Company",
    llp: "Limited Liability Partnership",
    "private-limited-company": "Private Limited",
    "public-limited-company": "Public Limited",
  };
  return map[type] || type.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderMarkdown(text: string) {
  if (!text) return null;

  return text.split("\n").map((line, i) => {
    if (/^\*\*[A-Z0-9\s\.\-\/]+\*\*$/.test(line.trim())) {
      const clean = line.replace(/\*\*/g, "");
      return (
        <div key={i} style={{ marginTop: i === 0 ? 0 : "22px", marginBottom: "8px" }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.25em", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase" as const }}>
            {clean}
          </span>
        </div>
      );
    }

    if (/^[-*] \*\*.+\*\*:/.test(line)) {
      const match = line.match(/^[-*] \*\*(.+?)\*\*:\s*(.*)/);
      if (match) {
        return (
          <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "7px", fontSize: "13px", fontFamily: "'Inter', system-ui, sans-serif" }}>
            <span style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: "1px" }}>·</span>
            <span>
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{match[1]}: </span>
              <span style={{ color: "var(--text-tertiary)" }}>{match[2].replace(/\*\*/g, "")}</span>
            </span>
          </div>
        );
      }
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "7px", fontSize: "13px", fontFamily: "'Inter', system-ui, sans-serif" }}>
          <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>·</span>
          <span style={{ color: "var(--text-tertiary)" }}>{line.slice(2).replace(/\*\*/g, "")}</span>
        </div>
      );
    }

    if (line.trim() === "") return <div key={i} style={{ height: "5px" }} />;

    return (
      <p key={i} style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: "0 0 7px 0", fontFamily: "'Inter', system-ui, sans-serif", lineHeight: 1.7 }}>
        {line.replace(/\*\*/g, "")}
      </p>
    );
  });
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [count, setCount] = useState(5);
  const [activeCategory, setActiveCategory] = useState("all");

  const [filingsResult, setFilingsResult] = useState<FilingsResult | null>(null);
  const [annualReport, setAnnualReport] = useState<AnnualReport | null>(null);
  const [loadingFilings, setLoadingFilings] = useState(false);
  const [loadingAR, setLoadingAR] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    setCompanies(null);
    setSelectedCompany(null);
    setFilingsResult(null);
    setAnnualReport(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCompanies(data.companies || []);
    } catch {
      setError("Search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectCompany(company: Company) {
    setSelectedCompany(company);
    setCompanies(null);
    setFilingsResult(null);
    setAnnualReport(null);
    setActiveCategory("all");
    setError("");

    setLoadingFilings(true);
    setLoadingAR(true);

    fetch(`/api/filings?company_number=${encodeURIComponent(company.company_number)}&company_name=${encodeURIComponent(company.title)}&count=${count}`)
      .then(r => r.json())
      .then(data => setFilingsResult(data))
      .catch(() => setError("Could not retrieve filings."))
      .finally(() => setLoadingFilings(false));

    fetch(`/api/annual-report?company_number=${encodeURIComponent(company.company_number)}&company_name=${encodeURIComponent(company.title)}`)
      .then(r => r.json())
      .then(data => setAnnualReport(data))
      .catch(() => {})
      .finally(() => setLoadingAR(false));
  }

  function handleReset() {
    setQuery("");
    setCompanies(null);
    setSelectedCompany(null);
    setFilingsResult(null);
    setAnnualReport(null);
    setError("");
  }

  const categories = filingsResult
    ? ["all", ...Array.from(new Set(filingsResult.filings.map(f => f.category).filter(Boolean)))]
    : [];

  const filteredFilings = filingsResult?.filings.filter(
    f => activeCategory === "all" || f.category === activeCategory
  ) || [];

  const isIdle = !companies && !selectedCompany && !loadingFilings && !loadingAR;

  return (
    <main style={{ background: "var(--bg)", color: "var(--text-primary)", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <header style={{ borderBottom: "1px solid var(--border)", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)" }}>
        <div
          style={{ display: "flex", alignItems: "baseline", gap: "14px", cursor: "pointer" }}
          onClick={handleReset}
        >
          <span style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "19px", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
            DisclosureLens
          </span>
          <span className="label" style={{ color: "var(--text-muted)" }}>UK Regulatory Intelligence</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span className="label" style={{ color: "var(--text-muted)" }}>Companies House · Live</span>
          <span className="tag">BETA</span>
          <button
            onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text-tertiary)", padding: "5px 10px", cursor: "pointer", fontFamily: "'DM Mono', monospace", fontSize: "10px", borderRadius: "2px", letterSpacing: "0.1em" }}
          >
            {theme === "light" ? "DARK" : "LIGHT"}
          </button>
        </div>
      </header>

      <div className="page-wrap">
        {isIdle && (
          <div className="fade-up" style={{ marginBottom: "56px" }}>
            <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(36px, 5vw, 58px)", lineHeight: 1.05, letterSpacing: "-0.025em", color: "var(--text-primary)", margin: "0 0 20px 0", fontWeight: 400 }}>
              UK company filings,<br />
              <em style={{ color: "var(--text-muted)", fontStyle: "italic" }}>decoded.</em>
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.7, margin: 0, maxWidth: "480px" }}>
              Live Companies House data. AI-powered analyst briefs. Any UK registered company — from FTSE 100 to private limited.
            </p>
          </div>
        )}

        <div className="fade-up-1" style={{ marginBottom: "48px" }}>
          <label className="label" style={{ display: "block", marginBottom: "10px" }}>Company name</label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px" }}>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="e.g. Tesco, Barclays, BP, Rolls-Royce"
            />
            <button className="btn-primary" onClick={handleSearch} disabled={searching || loadingFilings}>
              {searching ? "Searching…" : "Search →"}
            </button>
          </div>

          {!selectedCompany && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
              <span className="label" style={{ marginRight: "4px" }}>Filings to retrieve:</span>
              {[3, 5, 10].map(n => (
                <button key={n} className={`btn-count${count === n ? " active" : ""}`} onClick={() => setCount(n)}>{n}</button>
              ))}
            </div>
          )}
        </div>

        {searching && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
            <span className="pulse" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
            <span className="label">Searching Companies House…</span>
          </div>
        )}

        {companies && companies.length > 0 && (
          <div className="fade-up" style={{ marginBottom: "32px" }}>
            <p className="label" style={{ marginBottom: "14px" }}>
              {companies.length} result{companies.length !== 1 ? "s" : ""} — select a company
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {companies.map((company, i) => (
                <div key={i} className="company-row" onClick={() => handleSelectCompany(company)}>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "5px" }}>
                      {company.title}
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em" }}>
                        #{company.company_number}
                      </span>
                      {company.company_status && (
                        <span className={company.company_status === "active" ? "status-active" : "status-dissolved"}
                          style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                          {company.company_status}
                        </span>
                      )}
                      {company.address && (
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{company.address}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {company.company_type && (
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "3px" }}>
                        {formatCompanyType(company.company_type)}
                      </div>
                    )}
                    {company.date_of_creation && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "var(--text-muted)" }}>
                        Est. {new Date(company.date_of_creation).getFullYear()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {companies && companies.length === 0 && (
          <p style={{ fontSize: "13px", color: "var(--text-muted)", padding: "8px 0" }}>No companies found.</p>
        )}

        {error && (
          <div style={{ borderLeft: "3px solid #dc2626", padding: "12px 16px", background: "rgba(220,38,38,0.05)", fontSize: "12px", color: "#dc2626", marginBottom: "24px", borderRadius: "2px" }}>
            {error}
          </div>
        )}

        {selectedCompany && (
          <div style={{ marginBottom: "40px", paddingBottom: "28px", borderBottom: "1px solid var(--border)" }}>
            <div className="label" style={{ marginBottom: "10px" }}>Registered company</div>
            <h2 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 400, letterSpacing: "-0.02em", color: "var(--text-primary)", margin: "0 0 12px 0" }}>
              {selectedCompany.title}
            </h2>
            <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--text-muted)" }}>
                CH No. {selectedCompany.company_number}
              </span>
              <span style={{ color: "var(--border)" }}>·</span>
              <button className="btn-ghost" onClick={handleReset}>New search</button>
            </div>
          </div>
        )}

        {(loadingAR || annualReport) && (
          <div style={{ marginBottom: "56px" }}>
            <h3 className="section-heading">Annual Report Brief</h3>

            {loadingAR && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "24px 0" }}>
                <span className="pulse" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                <span className="label">Retrieving annual accounts…</span>
              </div>
            )}

            {annualReport && !loadingAR && (
              <div className="annual-report-box">
                {!annualReport.found ? (
                  <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: 0 }}>{annualReport.message}</p>
                ) : annualReport.warning ? (
                  <div>
                    <p style={{ fontSize: "13px", color: "var(--text-tertiary)", margin: "0 0 8px 0" }}>{annualReport.message}</p>
                    <a
                      className="accent-link"
                      style={{ fontSize: "12px", fontFamily: "'DM Mono', monospace" }}
                      href={`https://find-and-update.company-information.service.gov.uk/company/${annualReport.company_number}/filing-history`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Companies House register
                    </a>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <div className="label" style={{ marginBottom: "4px" }}>Most recent annual accounts</div>
                        <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>
                          {annualReport.type?.toUpperCase()} · Filed {formatDate(annualReport.date || "")}
                        </div>
                      </div>
                      <a
                        className="accent-link"
                        style={{ fontSize: "10px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", flexShrink: 0, marginLeft: "16px" }}
                        href={`https://find-and-update.company-information.service.gov.uk/company/${annualReport.company_number}/filing-history`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Full document →
                      </a>
                    </div>
                    {(() => {
                     const isEmptySummary = annualReport.summary?.toLowerCase().includes("unfortunately");

                      return isEmptySummary ? (
                        <div style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>
                          Annual accounts were found but contained insufficient financial narrative to generate a useful brief.{" "}
                          <a
                            className="accent-link"
                            href={`https://find-and-update.company-information.service.gov.uk/company/${annualReport.company_number}/filing-history`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View full document on Companies House
                          </a>
                        </div>
                      ) : (
                        renderMarkdown(annualReport.summary || "")
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(loadingFilings || filingsResult) && (
          <div>
            <h3 className="section-heading">Recent Statutory Filings</h3>

            {loadingFilings && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "24px 0" }}>
                <span className="pulse" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
                <span className="label">Retrieving recent filings…</span>
              </div>
            )}

            {filingsResult && !loadingFilings && (
              <>
                {categories.length > 2 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "28px" }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        className={`btn-tag${activeCategory === cat ? " active" : ""}`}
                        onClick={() => setActiveCategory(cat)}
                      >
                        {cat === "all" ? "All" : (CATEGORY_LABELS[cat] || cat)}
                      </button>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                  {filteredFilings.map((filing, i) => (
                    <div
                      key={i}
                      className="filing-card"
                      style={{ opacity: 0, animation: `fadeUp 0.5s ease ${0.05 + i * 0.08}s forwards` }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                        <div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                            <span className="label">Filing {i + 1}</span>
                            {filing.category && (
                              <span className="tag">{CATEGORY_LABELS[filing.category] || filing.category}</span>
                            )}
                          </div>
                          <div style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 500, lineHeight: 1.4 }}>
                            {formatSlug(filing.description)}
                          </div>
                        </div>
                        <div style={{ flexShrink: 0, marginLeft: "20px" }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "var(--text-muted)" }}>
                            {formatDate(filing.date)}
                          </span>
                        </div>
                      </div>

                      {filing.warning ? (
                        <div className="warning-box">
                          <div style={{ marginBottom: "6px" }}>
                            Limited extractable text — typically a short statutory form or table-based document.
                          </div>
                          <a
                            className="accent-link"
                            style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.08em" }}
                            href={`https://find-and-update.company-information.service.gov.uk/company/${filingsResult.company_number}/filing-history`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View on Companies House register
                          </a>
                        </div>
                      ) : (
                        <div className="summary-box">
                          {renderMarkdown(filing.summary)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {isIdle && !error && (
          <div className="fade-up-2 empty-state">
            <p className="label" style={{ lineHeight: 2.2 }}>
              Enter any UK registered company name<br />
              to retrieve filings and generate analyst briefs
            </p>
          </div>
        )}
      </div>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px 40px", display: "flex", justifyContent: "space-between", background: "var(--surface)" }}>
        <span className="label" style={{ color: "var(--text-muted)" }}>DISCLOSURELENS</span>
        <span className="label" style={{ color: "var(--text-muted)" }}>COMPANIES HOUSE API · OPEN DATA</span>
      </footer>
    </main>
  );
}