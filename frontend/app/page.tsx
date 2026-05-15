"use client";

import { useState } from "react";

interface Filing {
  date: string;
  description: string;
  summary: string;
}

interface Result {
  company: string;
  company_number: string;
  filings: Filing[];
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
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Check the company name and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e8e4dc] font-mono">
      {/* Header */}
      <div className="border-b border-[#1f1f1f] px-8 py-5 flex items-center justify-between">
        <div>
          <span className="text-xs tracking-[0.3em] text-[#4a4a4a] uppercase">UK Regulatory Intelligence</span>
          <h1 className="text-xl font-bold tracking-tight text-[#e8e4dc] mt-0.5">DisclosureLens</h1>
        </div>
        <span className="text-xs text-[#2a2a2a] border border-[#1a1a1a] px-3 py-1">BETA</span>
      </div>

      <div className="max-w-3xl mx-auto px-8 py-16">
        {/* Search */}
        <div className="mb-16">
          <p className="text-xs tracking-[0.2em] text-[#4a4a4a] uppercase mb-6">
            Companies House · Live Register
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter company name — e.g. Tesco, Barclays, BP"
              className="flex-1 bg-[#0f0f0f] border border-[#1f1f1f] text-[#e8e4dc] placeholder-[#2a2a2a] px-4 py-3 text-sm focus:outline-none focus:border-[#3a3a3a] transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#e8e4dc] text-[#0a0a0a] px-6 py-3 text-xs tracking-[0.2em] uppercase font-bold hover:bg-white transition-colors disabled:opacity-40"
            >
              {loading ? "Analysing..." : "Analyse"}
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="border border-[#1f1f1f] p-8">
            <div className="flex items-center gap-3 text-xs text-[#3a3a3a] tracking-widest uppercase">
              <span className="animate-pulse">●</span>
              Fetching filings from Companies House register...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="border border-red-900 bg-red-950/20 p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            <div className="mb-8 pb-6 border-b border-[#1a1a1a]">
              <p className="text-xs text-[#3a3a3a] tracking-widest uppercase mb-1">Company</p>
              <h2 className="text-2xl font-bold tracking-tight">{result.company}</h2>
              <p className="text-xs text-[#3a3a3a] mt-1">#{result.company_number}</p>
            </div>

            <div className="space-y-8">
              {result.filings.map((filing, i) => (
                <div key={i} className="border border-[#1a1a1a] p-6">
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#141414]">
                    <div>
                      <p className="text-xs text-[#3a3a3a] tracking-widest uppercase mb-1">Filing {i + 1}</p>
                      <p className="text-sm text-[#6a6a6a]">{filing.description.replace(/-/g, " ")}</p>
                    </div>
                    <span className="text-xs text-[#3a3a3a] whitespace-nowrap ml-4">{filing.date}</span>
                  </div>
                  <div className="text-sm text-[#9a9a9a] leading-relaxed whitespace-pre-wrap">
                    {filing.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !result && !error && (
          <div className="border border-dashed border-[#1a1a1a] p-12 text-center">
            <p className="text-xs text-[#2a2a2a] tracking-widest uppercase">
              Enter a UK registered company name to retrieve and analyse its latest filings
            </p>
          </div>
        )}
      </div>
    </main>
  );
}