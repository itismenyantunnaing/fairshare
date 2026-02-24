"use client";
import { useToast } from "@/context/ToastContext";

export default function Toast() {
  const { toast, hideToast } = useToast();

  if (!toast) return null;

  const isSuccess = toast.type === "success";
  const isError = toast.type === "error";

  return (
    <div
      className="fixed top-20 right-4 z-[100] max-w-sm w-full shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div
        className={`rounded-xl border shadow-lg p-4 flex items-start gap-3 ${
          isSuccess
            ? "bg-green-50 border-green-200 text-green-900"
            : isError
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-gray-50 border-gray-200 text-gray-900"
        }`}
      >
        <span className="flex-shrink-0 mt-0.5">
          {isSuccess ? (
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : isError ? (
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <span className="w-5 h-5 block rounded-full bg-gray-400" />
          )}
        </span>
        <p className="text-sm font-medium flex-1 min-w-0">{toast.message}</p>
        <button
          type="button"
          onClick={hideToast}
          className="flex-shrink-0 text-gray-500 hover:text-gray-700 p-1 rounded"
          aria-label="ပိတ်ရန်"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
