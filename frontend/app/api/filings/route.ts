import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const company_number = req.nextUrl.searchParams.get("company_number");
  const company_name = req.nextUrl.searchParams.get("company_name");
  const count = req.nextUrl.searchParams.get("count") || "5";

  if (!company_number || !company_name) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const res = await fetch(
    `http://localhost:8000/filings?company_number=${encodeURIComponent(company_number)}&company_name=${encodeURIComponent(company_name)}&count=${count}`
  );

  // Pass the stream straight through
  return new NextResponse(res.body, {
    headers: { "Content-Type": "text/plain" },
  });
}