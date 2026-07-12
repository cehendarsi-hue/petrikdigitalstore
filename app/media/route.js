import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pathname = searchParams.get("path");

    if (!pathname || pathname.includes("..")) {
      return NextResponse.json({ message: "Path media tidak valid." }, { status: 400 });
    }

    const blob = await get(pathname, { access: "private" });

    if (!blob?.stream) {
      return NextResponse.json({ message: "Media tidak ditemukan." }, { status: 404 });
    }

    return new Response(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=3600"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Gagal mengambil media." },
      { status: 500 }
    );
  }
}
