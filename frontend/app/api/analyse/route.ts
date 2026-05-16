import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const company_number = req.nextUrl.searchParams.get("company_number");
  const company_name = req.nextUrl.searchParams.get("company_name");
  const count = req.nextUrl.searchParams.get("count") || "5";

  if (!company_number || !company_name) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://disclosure-lens-api.onrender.com/analyse?company_number=${encodeURIComponent(company_number)}&company_name=${encodeURIComponent(company_name)}&count=${count}`
    );
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}