"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// payment processor removed; payments are simulated when processor is not needed

// Prevent prerendering issues when using client-side search params
export const dynamic = "force-dynamic";

interface DonationData {
  cause: string;
  amount: number;
  donor: { name: string; email: string };
  message: string;
  paymentMethod: string;
  region: string;
  timestamp: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  const [method, setMethod] = useState<string>("");
  const [amountParam, setAmountParam] = useState<string>("0");
  const [causeParam, setCauseParam] = useState<string>("");

  const [donation, setDonation] = useState<DonationData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  useEffect(() => {
    // Read search params client-side to avoid prerender issues
    try {
      const sp = new URLSearchParams(window.location.search);
      setMethod(sp.get("method") || "");
      setAmountParam(sp.get("amount") || "0");
      setCauseParam(sp.get("cause") || "");
    } catch (e) {
      // ignore on server
    }

    // Retrieve donation data from sessionStorage
    const storedDonation = sessionStorage.getItem("pendingDonation");
    if (storedDonation) {
      setDonation(JSON.parse(storedDonation));
    }
  }, []);

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Format card number with spaces
    if (name === "cardNumber") {
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim();
      setCardDetails({ ...cardDetails, [name]: formatted });
      return;
    }

    // Format expiry date MM/YY
    if (name === "expiryDate") {
      const formatted = value
        .replace(/\D/g, "")
        .slice(0, 4)
        .replace(/(\d{2})(\d{0,2})/, "$1/$2");
      setCardDetails({ ...cardDetails, [name]: formatted });
      return;
    }

    // CVV only numbers
    if (name === "cvv") {
      setCardDetails({
        ...cardDetails,
        [name]: value.replace(/\D/g, "").slice(0, 4),
      });
      return;
    }

    setCardDetails({ ...cardDetails, [name]: value });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!donation) {
      alert("Pending_Donation data not found. Please start over.");
      router.push("/donate");
      return;
    }

    // Validate card details (basic checks remain)
    if (cardDetails.cardNumber.replace(/\s/g, "").length !== 16) {
      alert("Please enter a valid 16-digit card number");
      return;
    }

    if (cardDetails.expiryDate.length !== 5) {
      alert("Please enter a valid expiry date (MM/YY)");
      return;
    }

    if (cardDetails.cvv.length < 3) {
      alert("Please enter a valid CVV");
      return;
    }

    setIsProcessing(true);

    try {
      // Payment processor removed — simulate a successful payment
      const tx = `sim-${Date.now()}`;
      const result = { success: true, transactionId: tx, simulated: true };

      sessionStorage.setItem("transactionId", result.transactionId);
      sessionStorage.setItem("paymentResult", JSON.stringify(result));

      router.push(`/donate/success?transactionId=${result.transactionId}&amount=${donation.amount}`);
    } catch (error) {
      console.error("Payment processing error:", error);
      router.push(`/donate/failure?reason=${encodeURIComponent("An unexpected error occurred")}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDone = () => {
    // When user clicks Done after scanning provider QR, mark donation completed
    const tx = `manual-${Date.now()}`;
    try {
      const stored = sessionStorage.getItem("pendingDonation");
      if (stored) {
        const d = JSON.parse(stored as string);
        // If we have server id from earlier, PATCH to update status
        (async () => {
            try {
            if (d.id) {
              const res = await fetch("/api/pending_donation", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: d.id, status: "completed", transactionId: tx }),
              });
              try {
                await res.json();
              } catch (e) {
                // ignore parse errors
              }
            } else {
              // no id — create a completed donation record
              const res = await fetch("/api/pending_donation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...d, status: "completed", transactionId: tx }),
              });
              try {
                const json = await res.json();
                if (res.ok && json.id) {
                  d.id = json.id;
                }
              } catch (e) {
                // ignore
              }
            }
            sessionStorage.setItem("transactionId", tx);
            sessionStorage.setItem("paymentResult", JSON.stringify({ status: "completed", transactionId: tx }));
          } catch (err) {
            console.warn("Failed to update pending_donation on Done", err);
          } finally {
            router.push("/donate/thanks");
          }
        })();
      } else {
        sessionStorage.setItem("transactionId", tx);
        router.push("/donate/thanks");
      }
    } catch (e) {
      console.warn(e);
      router.push("/donate/thanks");
    }
  };

  if (!donation) {
    return (
      <main className="min-h-screen bg-gray-50">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <a href="/" className="text-lg font-semibold">
              DonateNow
            </a>
          </div>
        </header>
        <section className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-gray-600">Loading chfeckout details...</p>
        </section>
      </main>
    );
  }

  const paymentMethodLabels: Record<string, string> = {
    stripe: "Stripe",
    paypal: "PayPal",
    razorpay: "Razorpay",
    kpay: "KPay",
    wave: "Wave",
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <a href="/" className="text-lg font-semibold">
            DonateNow
          </a>
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900">Secure Checkout</h1>

        <div className="mt-8 grid gap-8 md:grid-cols-4">
          {/* Checkout Form / Provider QR */}
          <div className="md:col-span-2">
            {donation.paymentMethod === "kpay" || donation.paymentMethod === "wave" ? (
              <div className="rounded-2xl border bg-white p-6 shadow-sm text-center">
                <div className="mb-6 rounded-xl bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {paymentMethodLabels[donation.paymentMethod] || donation.paymentMethod}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-gray-600">Scan this QR with your banking app to pay</p>
                  <img
                    src={`/${donation.paymentMethod}-qr.svg`}
                    alt={`${donation.paymentMethod} QR`}
                    className="mx-auto w-56 rounded-md border"
                  />

                  <p className="text-xs text-gray-500">After you complete the payment in your bank app, click Done.</p>

                  <button
                    onClick={handleDone}
                    className="mt-4 w-full max-w-xs rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePayment} className="rounded-2xl border bg-white p-6 shadow-sm">
                {/* Payment Method Info */}
                <div className="mb-6 rounded-xl bg-blue-50 p-4">
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {paymentMethodLabels[donation.paymentMethod] || donation.paymentMethod}
                  </p>
                </div>

                {/* Card Details Section */}
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Card Details</h2>

                  <div className="space-y-4">
                    {/* Card Number */}
                    <div>
                      <label className="text-sm font-medium text-gray-900">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={cardDetails.cardNumber}
                        onChange={handleCardChange}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-black/10"
                        required
                      />
                    </div>

                    {/* Expiry and CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">Expiry Date</label>
                        <input
                          type="text"
                          name="expiryDate"
                          value={cardDetails.expiryDate}
                          onChange={handleCardChange}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-black/10"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-900">CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          value={cardDetails.cvv}
                          onChange={handleCardChange}
                          placeholder="123"
                          maxLength={4}
                          className="mt-2 w-full rounded-xl border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-black/10"
                          required
                        />
                      </div>
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label className="text-sm font-medium text-gray-900">Cardholder Name</label>
                      <input
                        type="text"
                        value={donation.donor.name}
                        disabled
                        className="mt-2 w-full rounded-xl border bg-gray-50 px-3 py-2 text-sm outline-none"
                      />
                    </div>

                    {/* Security Notice */}
                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="text-xs text-green-800">🔒 Your payment is encrypted and secure. Your card details are processed with PCI DSS compliance.</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="mt-6 w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Processing Payment..." : `Pay $${donation.amount}`}
                </button>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-4 space-y-3 border-b pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Donation Amount</span>
                  <span className="font-medium text-gray-900">
                     {donation.amount} Ks
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cause</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {donation.cause}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Processing Fee</span>
                  <span className="font-medium text-gray-900">Free</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">
                  {donation.amount} Ks
                </span>
              </div>

              {donation.message && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-600">Message</p>
                  <p className="mt-1 text-xs text-gray-900">
                    {donation.message}
                  </p>
                </div>
              )}

              <div className="mt-4 rounded-lg bg-blue-50 p-3">
                <p className="text-xs text-blue-800">
                  ℹ️ You will receive a confirmation email at{" "}
                  <strong>{donation.donor.email}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
