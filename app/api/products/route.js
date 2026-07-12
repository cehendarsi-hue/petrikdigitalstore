import { NextResponse } from "next/server";
import { assertAdminPassword, getCatalog, saveCatalog } from "@/lib/productsStore";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await getCatalog();
  return NextResponse.json(catalog);
}

export async function POST(request) {
  try {
    const payload = await request.json();
    assertAdminPassword(payload.password);
    const catalog = await saveCatalog(payload.catalog);

    return NextResponse.json({ ok: true, catalog });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error.message || "Gagal menyimpan katalog." },
      { status: error.status || 500 }
    );
  }
}
