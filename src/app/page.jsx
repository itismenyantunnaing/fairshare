import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            ကလေးများခိုလှုံရာအိမ်များအတွက်
            <br />
            <span className="text-blue-600">မျှတသောအလှူငွေ</span> ပလက်ဖောင်း
          </h1>
          <p className="text-gray-500 mt-6 text-lg max-w-2xl mx-auto leading-relaxed">
            FairShare သည် ကလေးများခိုလှုံရာအိမ်များနှင့် အလှူရှင်များကို ချိတ်ဆက်ပေးပြီး
            ပွင့်လင်းမြင်သာမှုရှိသော အလှူငွေများကို ဆောင်ရွက်ပေးပါသည်။
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-blue-600 text-white py-3.5 px-8 rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm text-center"
            >
              အကောင့်ဖွင့်ရန်
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-white text-gray-700 py-3.5 px-8 rounded-xl font-semibold hover:bg-gray-50 transition border border-gray-200 shadow-sm text-center"
            >
              အကောင့်ဝင်ရန်
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI ဖြင့် အတည်ပြုခြင်း</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              ခိုလှုံရာအိမ် လက်မှတ်များကို AI နည်းပညာဖြင့် အလိုအလျောက် စစ်ဆေးအတည်ပြုပါသည်။
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">မျှတသော အလှူငွေ</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              အလှူရှင်များသည် စစ်မှန်သော ခိုလှုံရာအိမ်များသို့ တိုက်ရိုက် လှူဒါန်းနိုင်ပါသည်။
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">ပွင့်လင်းမြင်သာမှု</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              အလှူငွေ အသုံးပြုမှုများကို ပွင့်လင်းမြင်သာစွာ ကြည့်ရှုနိုင်ပါသည်။
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
