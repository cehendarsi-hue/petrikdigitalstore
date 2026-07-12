import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    blobReady: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    blobAccess: "private",
    isProduction: process.env.NODE_ENV === "production"
  });
}
