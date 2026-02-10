import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('sessionId='));
    const sessionId = match ? match.split('=')[1] : null;
    if (sessionId) await deleteSession(sessionId);

    // Clear cookie
    const expired = `sessionId=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax` + (process.env.NODE_ENV === 'production' ? '; Secure' : '');
    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Set-Cookie': expired } });
  } catch (err) {
    console.error('/api/auth/logout POST error', err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
