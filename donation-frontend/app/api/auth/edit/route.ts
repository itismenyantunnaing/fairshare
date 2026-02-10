import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import crypto from 'crypto';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, email, password, profilePhoto } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const db = await getDb();
    const update: any = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (password) {
      const salt = crypto.randomBytes(16).toString('hex');
      const derived = (await scryptPromise(password, salt)).toString('hex');
      update.passwordHash = derived;
      update.salt = salt;
    }
    if (profilePhoto !== undefined) {
      update.profilePhoto = profilePhoto && profilePhoto.trim() !== '' ? profilePhoto.trim() : '/default-avatar.svg';
    }
    const res = await db.collection('donar_account').findOneAndUpdate({ _id: new (require('mongodb').ObjectId)(id) }, { $set: update }, { returnDocument: 'after' });
    if (!res.value) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const profile = { id: res.value._id.toString(), name: res.value.name, email: res.value.email, profilePhoto: res.value.profilePhoto || '/default-avatar.svg' };
    return NextResponse.json({ profile });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

function scryptPromise(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}
