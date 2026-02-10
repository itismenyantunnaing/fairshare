import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('sessionId='));
    const sessionId = match ? match.split('=')[1] : null;
    if (!sessionId) return NextResponse.json({ ok: false, profile: null }, { status: 200 });

    const profile = await getUserFromSession(sessionId);
    if (!profile) return NextResponse.json({ ok: false, profile: null }, { status: 200 });
    return NextResponse.json({ ok: true, profile }, { status: 200 });
  } catch (err) {
    console.error('/api/auth/session GET error', err);
    return NextResponse.json({ ok: false, profile: null }, { status: 500 });
  }
}
