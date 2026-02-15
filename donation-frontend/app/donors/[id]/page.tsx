import { getDb } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import Link from 'next/link';

type Props = { params: { id: string } };

export default async function DonorDetail({ params }: Props) {
  try {
    // `params` may be a Promise in some Next.js versions — await to unwrap safely
    const p: any = await params as any;
    const db = await getDb();
    const donor = await db.collection('donar_account').findOne({ _id: new ObjectId(p.id) }, { projection: { passwordHash: 0, salt: 0 } });
    if (!donor) {
      return (
        <main className="min-h-screen flex items-center justify-center">Donor not found</main>
      );
    }

    // Fetch certificates for this donor
    const certificates = await db
      .collection('certificates')
      .find({ donorEmail: donor.email })
      .sort({ issuedAt: -1 })
      .toArray();

    const profilePhoto = donor.profilePhoto || '/default-avatar.svg';

    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-md overflow-hidden">
          <div className="relative w-full h-56 bg-gray-200">
            <img src={profilePhoto} alt="profile" className="w-full h-full object-cover" />
            <div className="absolute left-4 bottom-4 bg-black bg-opacity-60 text-white px-4 py-2 rounded">
              <div className="font-semibold">{donor.name ?? '—'}</div>
              <div className="text-sm opacity-90">{donor.email}</div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-medium mb-3">Details</h2>
            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">
              <div className="flex justify-between">
                <div className="font-medium">Name</div>
                <div>{donor.name ?? '—'}</div>
              </div>
              <div className="flex justify-between">
                <div className="font-medium">Email</div>
                <div>{donor.email}</div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Link href="/donors" className="rounded-lg border px-4 py-2">Back to donors</Link>
            </div>
          </div>

          <div className="p-6 border-t">
            <h2 className="text-lg font-medium mb-3">Certificates</h2>
            {certificates.length === 0 ? (
              <div className="rounded border-dashed border-2 border-gray-200 p-6 text-center text-sm text-gray-600">
                <div className="mb-2">No certificates available yet.</div>
                <div className="text-xs text-gray-500">Certificates are issued/approved by the admin and will appear here when available.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert: any) => (
                  <div key={String(cert._id)} className="rounded border border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{cert.certificateNo}</div>
                      <div className="text-xs text-gray-600">
                        {cert.type} • Issued {new Date(cert.issuedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <a
                      href={cert.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800"
                    >
                      View PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    );
  } catch (err) {
    console.error('donors/[id] page error', err);
    return (<main className="min-h-screen flex items-center justify-center">Server error</main>);
  }
}
