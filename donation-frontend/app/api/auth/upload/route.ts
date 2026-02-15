import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

type ReqBody = { filename: string; data: string };

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();
    if (!body.filename || !body.data) return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });

    // data can be a data URL or raw base64
    let matches = body.data.match(/^data:(image\/(png|jpeg|jpg|svg\+xml));base64,(.*)$/i);
    let ext = '';
    let b64 = '';
    if (matches) {
      ext = matches[1].includes('svg') ? 'svg' : (matches[2] === 'jpeg' ? 'jpg' : matches[2]);
      b64 = matches[3];
    } else {
      // try to infer ext from filename
      ext = path.extname(body.filename).replace('.', '') || 'png';
      b64 = body.data;
    }

    // sanitize filename
    const safeName = path.basename(body.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const name = `${Date.now()}-${safeName}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const outPath = path.join(uploadsDir, name);
    const buffer = Buffer.from(b64, 'base64');
    fs.writeFileSync(outPath, buffer);

    const urlPath = `/uploads/${name}`;
    return NextResponse.json({ ok: true, url: urlPath });
  } catch (err) {
    console.error('/api/auth/upload error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

