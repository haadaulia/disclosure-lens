import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://disclosure-lens-api.onrender.com/search?q=${encodeURIComponent(q)}`
    );
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reach backend" }, { status: 500 });
  }
}