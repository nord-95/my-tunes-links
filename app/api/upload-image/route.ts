import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;
const FOLDER = process.env.R2_FOLDER || "mytunes";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
const MAX_SIZE_MB = 10;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File type not allowed. Use JPEG, PNG, WebP, GIF or SVG." }, { status: 400 });
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `File too large. Max ${MAX_SIZE_MB}MB.` }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const key = `${FOLDER}/${timestamp}-${random}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    if (!PUBLIC_URL) {
      return NextResponse.json({ error: "R2_PUBLIC_URL not configured" }, { status: 500 });
    }

    const url = `${PUBLIC_URL}/${key}`;
    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("upload-image error:", error.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
