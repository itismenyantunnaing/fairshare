import Image from "next/image";
import AuthNav from "./components/AuthNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="text-lg font-semibold">DonateNow</div>
          <AuthNav />
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900">
              Help someone today with a simple donation.
            </h1>
            <p className="mt-4 text-gray-600">
              Transparent causes, quick checkout, and impact you can track.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="/donate"
                className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
              >
                Donate now
              </a>
              <a
                href="#causes"
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-800 hover:bg-white"
              >
                View causes
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Causes */}
      <section id="causes" className="mx-auto max-w-5xl px-4 pb-16">
        <h2 className="text-2xl font-bold text-gray-900">Popular causes</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { id: "food", title: "Food Support", desc: "Meals for families in need." },
            { id: "health", title: "Medical Aid", desc: "Support critical care costs." },
            { id: "clothing", title: "Clothing Support", desc: "Clothes and accessories for those in need." },
          ].map((c) => (
            <a
              key={c.id}
              href={`/donate?cause=${c.id}`}
              className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow"
            >
              <div className="text-lg font-semibold">{c.title}</div>
              <p className="mt-2 text-sm text-gray-600">{c.desc}</p>
              <div className="mt-4 text-sm font-medium text-gray-900">
                Donate →
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-gray-600">
          © {new Date().getFullYear()} DonateNow. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

