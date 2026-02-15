import Image from "next/image";
import AuthNav from "./components/AuthNav";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg">
        <div className="flex w-full items-center justify-between px-12 py-3">

          {/* Logo - Far Left */}
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="relative h-10 w-10 overflow-hidden rounded-lg shadow-md">
              <Image
                src="/uploads/logo.png"
                alt="FairShare Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold text-white">
              FairShare
            </span>
          </a>

          {/* Navigation - Far Right */}
          <AuthNav />

        </div>
      </header>


      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-4 top-1/4 h-72 w-72 rounded-full bg-emerald-100 blur-3xl opacity-60"></div>
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-teal-100 blur-3xl opacity-60"></div>
          <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-amber-100 blur-3xl opacity-40"></div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Making a difference together
              </div>
              <h1 className="text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
                Your kindness can{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  change lives
                </span>
              </h1>
              <p className="mt-6 text-lg text-gray-600 md:text-xl">
                Join thousands of donors making a real impact. Transparent, quick, and meaningful donations that you can track.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
                <a
                  href="/donate"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/30"
                >
                  Start Donating
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
                <a
                  href="#causes"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition-all hover:border-emerald-300 hover:bg-emerald-50"
                >
                  Explore Causes
                </a>
              </div>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap justify-center gap-6 md:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-500">Donors</div>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">$500K+</div>
                  <div className="text-sm text-gray-500">Raised</div>
                </div>
                <div className="h-10 w-px bg-gray-200"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">50+</div>
                  <div className="text-sm text-gray-500">Causes</div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden md:block">
              <div className="relative aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 rotate-6"></div>
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-600 -rotate-3"></div>
                <div className="relative h-full w-full rounded-3xl bg-white p-2 shadow-2xl overflow-hidden">
                  <Image
                    src="/uploads/page_fill.jpeg"
                    alt="Hero Image"
                    fill
                    className="object-cover rounded-[22px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* How It Works */}
      <section id="how" className="bg-gradient-to-b from-gray-50 to-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full mb-4">
              SIMPLE PROCESS
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Making a difference has never been easier - follow these simple steps to start helping</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-24 left-16 right-16 h-1 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 rounded-full"></div>
            
            {[
              { number: "01", icon: "🔍", title: "Choose a Cause", desc: "Browse through our verified causes and find one that resonates with your heart.", gradient: "from-emerald-500 to-teal-500" },
              { number: "02", icon: "💝", title: "Make a Donation", desc: "Support with any amount through our secure payment system.", gradient: "from-teal-500 to-cyan-500" },
              { number: "03", icon: "📊", title: "Track Impact", desc: "Follow your contributions and see the real difference you're making.", gradient: "from-cyan-500 to-emerald-500" },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-2 text-center h-full">
                  {/* Number Badge */}
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-gradient-to-r ${step.gradient} text-white flex items-center justify-center text-lg font-bold shadow-lg`}>
                    {step.number}
                  </div>
                  
                  {/* Icon Circle */}
                  <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-5xl shadow-inner mt-4">
                    {step.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Causes */}
      <section id="causes" className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Popular Causes</h2>
            <p className="mt-4 text-gray-600">Support communities in need</p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: "food", icon: "🍱", title: "Food Support", desc: "Provide nutritious meals for families facing food insecurity.", color: "from-orange-400 to-red-400" },
              { id: "health", icon: "🏥", title: "Medical Aid", desc: "Support critical healthcare costs for those who can't afford treatment.", color: "from-rose-400 to-pink-500" },
              { id: "clothing", icon: "👕", title: "Clothing Support", desc: "Provide warm clothes and essentials for those in need.", color: "from-blue-400 to-indigo-500" },
            ].map((c) => (
              <a
                key={c.id}
                href={`/donate?cause=${c.id}`}
                className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-lg shadow-gray-200/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/60"
              >
                <div className={`absolute top-0 right-0 h-24 w-24 rounded-bl-full bg-gradient-to-br ${c.color} opacity-10 transition-transform group-hover:scale-150`}></div>
                <div className="relative">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 text-2xl">
                    {c.icon}
                  </div>
                  <div className="text-xl font-bold text-gray-900">{c.title}</div>
                  <p className="mt-2 text-gray-500">{c.desc}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm font-medium text-emerald-600">
                      Learn more
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-500 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to make a difference?
          </h2>
          <p className="mt-4 text-lg text-emerald-100">
            Every contribution, no matter the size, helps create meaningful change.
          </p>
          <a
            href="/donate"
            className="mt-8 inline-block rounded-2xl bg-white px-8 py-4 text-base font-semibold text-emerald-600 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            Donate Now
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="col-span-2">
              <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="relative h-9 w-9 overflow-hidden rounded-xl">
                  <Image
                    src="/uploads/logo.png"
                    alt="FairShare Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="text-xl font-bold text-white">FairShare</span>
              </a>
              <p className="mt-4 max-w-sm text-gray-400">
                A transparent donation platform connecting generous donors with verified causes around the world.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Quick Links</h4>
              <ul className="mt-4 space-y-2">
                <li><a href="/donate" className="text-gray-400 hover:text-white">Donate</a></li>
                <li><a href="/donors" className="text-gray-400 hover:text-white">Our Donors</a></li>
                <li><a href="/auth/profile" className="text-gray-400 hover:text-white">My Profile</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Support</h4>
              <ul className="mt-4 space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li><a href="/admin/login" className="text-gray-400 hover:text-white">Admin</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} FairShare. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}

