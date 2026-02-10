import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/session';
import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('sessionId='));
    const sessionId = match ? match.split('=')[1] : null;
    const viewer = await getUserFromSession(sessionId);
    if (!viewer) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    if (!id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });

    const db = await getDb();
    const donor = await db.collection('donar_account').findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0, salt: 0 } });
    if (!donor) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

    const out = { id: String(donor._id), name: donor.name || null, email: donor.email, profilePhoto: donor.profilePhoto || '/default-avatar.svg' };
    return NextResponse.json({ ok: true, donor: out });
  } catch (err) {
    console.error('/api/donors/[id] GET error', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
