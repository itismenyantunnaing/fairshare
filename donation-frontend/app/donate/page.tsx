"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// Fixed to Myanmar-only donation flow per request
const PRESETS = [5000, 10000, 20000, 50000];

const PAYMENT_METHODS = [
    { id: "kpay", label: "KPay", regions: ["mm"], icon: "📱" },
    { id: "wave", label: "Wave", regions: ["mm"], icon: "〰️" },
];

const REGION_INFO = { id: "mm", label: "Myanmar", currency: "MMK", symbol: "Ks" };

export default function DonatePage() {
    const router = useRouter();

    const [cause, setCause] = useState<string>("general");
    const [amount, setAmount] = useState<number>(5000);
    const [custom, setCustom] = useState<string>("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Food support specific state
    const [selectedItems, setSelectedItems] = useState<{ rice?: boolean; oil?: boolean; other?: boolean }>({});
    const [itemQuantities, setItemQuantities] = useState<{ rice: number; oil: number; other: number }>({ rice: 0, oil: 0, other: 0 });
    const [otherNote, setOtherNote] = useState("");

    // Medical aid specific state
    const [selectedMedical, setSelectedMedical] = useState<{ medicines?: boolean; bandages?: boolean; other?: boolean }>({});
    const [medicalQuantities, setMedicalQuantities] = useState<{ medicines: number; bandages: number; other: number }>({ medicines: 0, bandages: 0, other: 0 });
    const [medicalOtherNote, setMedicalOtherNote] = useState("");

    // Clothing support specific state (clothing)
    const [selectedClothes, setSelectedClothes] = useState<{ shirts?: boolean; pants?: boolean; other?: boolean }>({});
    const [clothingQuantities, setClothingQuantities] = useState<{ shirts: number; pants: number; other: number }>({ shirts: 0, pants: 0, other: 0 });
    const [clothingOtherNote, setClothingOtherNote] = useState("");

    async function submitFoodSupport() {
        // Validate selection and donor info
        if (!name || !email) {
            alert("Please enter your name and email");
            return;
        }

        const items: Array<any> = [];
        if (selectedItems.rice && itemQuantities.rice > 0) items.push({ item: "rice", qty: itemQuantities.rice });
        if (selectedItems.oil && itemQuantities.oil > 0) items.push({ item: "oil", qty: itemQuantities.oil });
        if (selectedItems.other && itemQuantities.other > 0) items.push({ item: "other", qty: itemQuantities.other, note: otherNote });

        if (items.length === 0) {
            alert("Please select at least one item with quantity");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                cause: "food",
                donor: { name, email },
                message,
                items,
                region: REGION_INFO.id,
                timestamp: new Date().toISOString(),
            };

            const res = await fetch("/api/pending_foodsupport", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            let json: any = {};
            try {
                json = await res.json();
            } catch (e) {
                // ignore
            }

            if (res.ok) {
                // optionally save id for later
                if (json.id) {
                    try {
                        sessionStorage.setItem("pendingFoodSupport", JSON.stringify({ ...payload, id: json.id }));
                    } catch (e) {}
                }
                router.push("/donate/thanks");
            } else {
                console.warn("Failed to create pending_foodsupport", json);
                alert("Failed to submit food support. Please try again.");
            }
        } catch (err) {
            console.error("Error submitting food support:", err);
            alert("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    async function submitMedicalSupport() {
        if (!name || !email) {
            alert("Please enter your name and email");
            return;
        }

        const items: Array<any> = [];
        if (selectedMedical.medicines && medicalQuantities.medicines > 0) items.push({ item: "medicines", qty: medicalQuantities.medicines });
        if (selectedMedical.bandages && medicalQuantities.bandages > 0) items.push({ item: "bandages", qty: medicalQuantities.bandages });
        if (selectedMedical.other && medicalQuantities.other > 0) items.push({ item: "other", qty: medicalQuantities.other, note: medicalOtherNote });

        if (items.length === 0) {
            alert("Please select at least one medical item with quantity");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                cause: "health",
                donor: { name, email },
                message,
                items,
                region: REGION_INFO.id,
                timestamp: new Date().toISOString(),
            };

            const res = await fetch("/api/pending_medicalaid", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            let json: any = {};
            try {
                json = await res.json();
            } catch (e) {}

            if (res.ok) {
                if (json.id) {
                    try { sessionStorage.setItem("pendingMedicalAid", JSON.stringify({ ...payload, id: json.id })); } catch (e) {}
                }
                router.push("/donate/thanks");
            } else {
                console.warn("Failed to create pending_medicalaid", json);
                alert("Failed to submit medical aid. Please try again.");
            }
        } catch (err) {
            console.error("Error submitting medical aid:", err);
            alert("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    async function submitClothingSupport() {
        if (!name || !email) {
            alert("Please enter your name and email");
            return;
        }

        const items: Array<any> = [];
        if (selectedClothes.shirts && clothingQuantities.shirts > 0) items.push({ item: "shirts", qty: clothingQuantities.shirts });
        if (selectedClothes.pants && clothingQuantities.pants > 0) items.push({ item: "pants", qty: clothingQuantities.pants });
        if (selectedClothes.other && clothingQuantities.other > 0) items.push({ item: "other", qty: clothingQuantities.other, note: clothingOtherNote });

        if (items.length === 0) {
            alert("Please select at least one clothing item with quantity");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                cause: "clothing",
                donor: { name, email },
                message,
                items,
                region: REGION_INFO.id,
                timestamp: new Date().toISOString(),
            };

            const res = await fetch("/api/pending_clothing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            let json: any = {};
            try { json = await res.json(); } catch (e) {}

            if (res.ok) {
                if (json.id) {
                    try { sessionStorage.setItem("pendingClothing", JSON.stringify({ ...payload, id: json.id })); } catch (e) {}
                }
                router.push("/donate/thanks");
            } else {
                console.warn("Failed to create pending_clothing", json);
                alert("Failed to submit clothing support. Please try again.");
            }
        } catch (err) {
            console.error("Error submitting clothing support:", err);
            alert("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }


    const selectedCauseLabel = useMemo(() => {
        const map: Record<string, string> = {
            general: "General Fund",
            food: "Food Support",
            health: "Medical Aid",
            clothing: "Clothing Support",
            };
        return map[cause] ?? "General Fund";
    }, [cause]);

    const regionInfo = REGION_INFO;

    const availablePaymentMethods = useMemo(() => {
        return PAYMENT_METHODS.filter((method) => method.regions.includes(REGION_INFO.id));
    }, []);

    const finalAmount = custom ? Number(custom) : amount;

    useEffect(() => {
        try {
            const sp = new URLSearchParams(window.location.search);
            const q = sp.get("cause");
            let c = q || "general";
            // accept legacy alias ?cause=edu and prefer canonical 'clothing'
            if (c === "edu") c = "clothing";
            setCause(c);
        } catch (e) {
            // ignore on server
        }
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (cause === "food") {
            await submitFoodSupport();
            return;
        }

        if (cause === "health") {
            await submitMedicalSupport();
            return;
        }

        if (!paymentMethod) {
            alert("Please select a payment method");
            return;
        }

        if (finalAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setIsLoading(true);

        try {
            // Create donation record and initiate payment
            const donationData = {
                cause,
                amount: finalAmount,
                donor: { name, email },
                message,
                paymentMethod,
                region: REGION_INFO.id,
                currency: regionInfo.currency,
                timestamp: new Date().toISOString(),
            };

            // Store donation data in session/context for checkout page
            sessionStorage.setItem("pendingDonation", JSON.stringify(donationData));

            // Redirect to checkout page with encoded params
            router.push(
                `/donate/checkout?method=${encodeURIComponent(paymentMethod)}&amount=${encodeURIComponent(
                    String(finalAmount)
                )}&cause=${encodeURIComponent(cause)}&region=${encodeURIComponent(REGION_INFO.id)}`
            );
        } catch (error) {
            console.error("Error initiating donation:", error);
            alert("Failed to proceed with donation. Please try again.");
            setIsLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gray-50">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
                    <a href="/" className="text-lg font-semibold">DonateNow</a>
                    <a href="/" className="text-sm text-gray-600 hover:text-gray-900">← Back</a>
                </div>
            </header>

            <section className="mx-auto max-w-3xl px-4 py-10">
                <h1 className="text-3xl font-bold text-gray-900">Make a donation</h1>
                <p className="mt-2 text-gray-600">
                    Cause: <span className="font-medium text-gray-900">{selectedCauseLabel}</span>
                </p>

                <form onSubmit={onSubmit} className="mt-8 rounded-2xl border bg-white p-12 shadow-sm">

                    {/* If cause is food, show food-item multi-select; otherwise show amount + donor info */}
                    {cause === "food" ? (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-900">Select food items</label>
                                <p className="mt-1 text-xs text-gray-500">Choose one or more items and set quantity.</p>

                                <div className="mt-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="rice" onChange={(e) => setSelectedItems({ ...selectedItems, rice: e.target.checked })} checked={!!selectedItems.rice} />
                                        <label htmlFor="rice" className="font-medium">Rice (kg)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(itemQuantities.rice)}
                                            onChange={(e) => setItemQuantities({ ...itemQuantities, rice: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="oil" onChange={(e) => setSelectedItems({ ...selectedItems, oil: e.target.checked })} checked={!!selectedItems.oil} />
                                        <label htmlFor="oil" className="font-medium">Cooking Oil (bottles)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(itemQuantities.oil)}
                                            onChange={(e) => setItemQuantities({ ...itemQuantities, oil: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="other" onChange={(e) => setSelectedItems({ ...selectedItems, other: e.target.checked })} checked={!!selectedItems.other} />
                                        <label htmlFor="other" className="font-medium">Other food</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. canned, noodles"
                                            value={otherNote}
                                            onChange={(e) => setOtherNote(e.target.value)}
                                            className="ml-4 w-40 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(itemQuantities.other)}
                                            onChange={(e) => setItemQuantities({ ...itemQuantities, other: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <hr className="my-6" />

                            {/* Donor info for food support */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Name</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        placeholder="you@email.com"
                                        required
                                    />
                                </div>
                            </div>

                        </>
                    ) : cause === "health" ? (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-900">Select medical items</label>
                                <p className="mt-1 text-xs text-gray-500">Choose one or more medical supplies and set quantity.</p>

                                <div className="mt-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="medicines" onChange={(e) => setSelectedMedical({ ...selectedMedical, medicines: e.target.checked })} checked={!!selectedMedical.medicines} />
                                        <label htmlFor="medicines" className="font-medium">Medicines (packs)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(medicalQuantities.medicines)}
                                            onChange={(e) => setMedicalQuantities({ ...medicalQuantities, medicines: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="bandages" onChange={(e) => setSelectedMedical({ ...selectedMedical, bandages: e.target.checked })} checked={!!selectedMedical.bandages} />
                                        <label htmlFor="bandages" className="font-medium">Bandages (boxes)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(medicalQuantities.bandages)}
                                            onChange={(e) => setMedicalQuantities({ ...medicalQuantities, bandages: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="medical_other" onChange={(e) => setSelectedMedical({ ...selectedMedical, other: e.target.checked })} checked={!!selectedMedical.other} />
                                        <label htmlFor="medical_other" className="font-medium">Other medical</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. ointments, syringes"
                                            value={medicalOtherNote}
                                            onChange={(e) => setMedicalOtherNote(e.target.value)}
                                            className="ml-4 w-40 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(medicalQuantities.other)}
                                            onChange={(e) => setMedicalQuantities({ ...medicalQuantities, other: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="my-6" />

                            {/* Donor info for medical aid */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Name</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        placeholder="you@email.com"
                                        required
                                    />
                                </div>
                            </div>

                        </>
                    ) : cause === "clothing" ? (
                        <>
                            <div>
                                <label className="text-sm font-medium text-gray-900">Select clothing items</label>
                                <p className="mt-1 text-xs text-gray-500">Choose one or more clothing items and set quantity.</p>

                                <div className="mt-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="shirts" onChange={(e) => setSelectedClothes({ ...selectedClothes, shirts: e.target.checked })} checked={!!selectedClothes.shirts} />
                                        <label htmlFor="shirts" className="font-medium">Shirts (pieces)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(clothingQuantities.shirts)}
                                            onChange={(e) => setClothingQuantities({ ...clothingQuantities, shirts: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="pants" onChange={(e) => setSelectedClothes({ ...selectedClothes, pants: e.target.checked })} checked={!!selectedClothes.pants} />
                                        <label htmlFor="pants" className="font-medium">Pants (pieces)</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(clothingQuantities.pants)}
                                            onChange={(e) => setClothingQuantities({ ...clothingQuantities, pants: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" id="clothing_other" onChange={(e) => setSelectedClothes({ ...selectedClothes, other: e.target.checked })} checked={!!selectedClothes.other} />
                                        <label htmlFor="clothing_other" className="font-medium">Other clothing</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. shoes, scarves"
                                            value={clothingOtherNote}
                                            onChange={(e) => setClothingOtherNote(e.target.value)}
                                            className="ml-4 w-40 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                        <input
                                            type="number"
                                            min={0}
                                            value={String(clothingQuantities.other)}
                                            onChange={(e) => setClothingQuantities({ ...clothingQuantities, other: Math.max(0, Number(e.target.value || 0)) })}
                                            className="ml-auto w-24 rounded-xl border px-3 py-2 text-sm outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            <hr className="my-6" />

                            {/* Donor info for clothing support */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Name</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        placeholder="you@email.com"
                                        required
                                    />
                                </div>
                            </div>

                        </>
                    ) : (
                        <>
                            {/* Amount */}
                            <div>
                                <label className="text-sm font-medium text-gray-900">Choose amount</label>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {PRESETS.map((v) => (
                                        <button
                                            type="button"
                                            key={v}
                                            onClick={() => {
                                                setAmount(v);
                                                setCustom("");
                                            }}
                                            className={`rounded-xl border px-4 py-2 text-sm font-medium ${!custom && amount === v ? "bg-black text-white" : "bg-white text-gray-900 hover:bg-gray-50"
                                                }`}
                                        >
                                            {v} {regionInfo?.symbol}
                                        </button>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={custom}
                                            onChange={(e) => setCustom(e.target.value.replace(/[^\\d]/g, ""))}
                                            placeholder="Custom"
                                            className="w-28 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        />
                                        <span className="text-sm text-gray-600">{regionInfo?.symbol}</span>

                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-600">
                                    Total: <span className="font-semibold text-gray-900">{Number.isFinite(finalAmount) ? finalAmount : 0} {regionInfo?.symbol}</span>
                                </p>
                            </div>

                            <hr className="my-6" />

                            {/* Donor info */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Name</label>
                                    <input
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        placeholder="Your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-900">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                                        placeholder="you@email.com"
                                        required
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mt-4">
                        <label className="text-sm font-medium text-gray-900">Message (optional)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                            placeholder="A short note…"
                            rows={4}
                        />
                    </div>

                    {cause !== "food" && cause !== "health" && cause !== "clothing" ? (
                        <>
                            <hr className="my-6" />

                            {/* Payment Method Selection */}
                            <div>
                                <label className="text-sm font-medium text-gray-900">Select Payment Method</label>
                                <p className="mt-1 text-xs text-gray-500">
                                    Available options for {regionInfo?.label}
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {availablePaymentMethods.length > 0 ? (
                                        availablePaymentMethods.map((method) => (
                                            <button
                                                key={method.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(method.id)}
                                                className={`rounded-xl border-2 p-4 text-center transition ${paymentMethod === method.id
                                                        ? "border-black bg-black/5"
                                                        : "border-gray-200 hover:border-gray-300"
                                                    }`}
                                            >
                                                <div className="text-2xl">{method.icon}</div>
                                                <div className="mt-2 text-sm font-medium text-gray-900">{method.label}</div>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="col-span-full text-sm text-gray-600">
                                            No payment methods available in your region. Please update your region.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* QR Pay option removed — using provider QR on checkout for KPay/Wave */}

                            <button
                                type="submit"
                                disabled={isLoading || !paymentMethod || finalAmount <= 0}
                                className="mt-6 w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Processing..." : "Continue to Checkout"}
                            </button>
                        </>
                    ) : (
                        <>
                            <hr className="my-6" />
                            <button
                                type="button"
                                onClick={() => {
                                    if (cause === "food") submitFoodSupport();
                                    else if (cause === "health") submitMedicalSupport();
                                    else if (cause === "clothing") submitClothingSupport();
                                }}
                                disabled={isLoading}
                                className="mt-6 w-full rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Processing..." : "Donate"}
                            </button>
                        </>
                    )}

                    <p className="mt-3 text-center text-xs text-gray-500">
                        Your donation is secure and your information is protected.
                    </p>
                </form>
            </section>
        </main>
    );
}
