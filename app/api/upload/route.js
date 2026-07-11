import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { assertAdminPassword } from "@/lib/productsStore";

export const dynamic = "force-dynamic";

function safeName(name = "product.jpg") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function POST(request) {
  try {
    const form = await request.formData();
    const password = form.get("password");
    const file = form.get("file");

    assertAdminPassword(password);

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, message: "File foto belum dipilih." }, { status: 400 });
    }

    const filename = `${Date.now()}-${safeName(file.name)}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`products/${filename}`, file, {
        access: "public",
        contentType: file.type || "application/octet-stream"
      });
      return NextResponse.json({ ok: true, url: blob.url });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, message: "BLOB_READ_WRITE_TOKEN belum diset untuk upload foto." },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error.message || "Upload foto gagal." },
      { status: error.status || 500 }
    );
  }
}
