import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { getDb } from '@/lib/mongodb';

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('sessionId='));
    const sessionId = match ? match.split('=')[1] : null;
    const viewer = await getUserFromSession(sessionId);
    if (!viewer) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const db = await getDb();
    // support optional search query ?q=term
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const query: any = {};
    if (q) {
      // escape regex chars
      const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(esc, 'i');
      query.$or = [ { name: re }, { email: re } ];
    }

    const rows = await db.collection('donar_account').find(query, { projection: { passwordHash: 0, salt: 0 } }).limit(200).toArray();
    const donors = rows.map((r:any) => ({ id: String(r._id), name: r.name || null, email: r.email, profilePhoto: r.profilePhoto || '/default-avatar.svg' }));
    return NextResponse.json({ ok: true, donors });
  } catch (err) {
    console.error('/api/donors GET error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
