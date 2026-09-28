"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function StudentFeesPage() {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(35000);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadFeeData();
  }, []);

  async function loadFeeData() {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const d = await meRes.json();
        if (d.user?.studentProfile?.invoices?.length > 0) {
          setInvoice(d.user.studentProfile.invoices[0]);
        }
      }
    } catch (e) {
      console.error("Failed to load fee data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulatePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!invoice) return;
    setPaying(true);
    setMessage(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: payAmount,
          paymentMethod: "UPI_GATEWAY",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Payment of ₹${payAmount.toLocaleString("en-IN")} processed successfully.`);
        setInvoice(data.invoice);
        setPayModalOpen(false);
      } else {
        setMessage(data.error || "Payment processing failed.");
      }
    } catch {
      setMessage("Failed to reach payment gateway.");
    } finally {
      setPaying(false);
    }
  }

  const feeItems = [
    { id: "INV-2025-001", desc: "Annual Tuition Fee 2025-26", due: "31 Oct 2025", amount: 75000, status: "Partially Paid" },
    { id: "INV-2025-002", desc: "VTU Registration & Autonomous Dev Fee", due: "15 Oct 2025", amount: 6000, status: "Paid" },
    { id: "INV-2025-003", desc: "Computer Lab & Library Caution Deposit", due: "01 Sep 2025", amount: 4000, status: "Paid" },
  ];

  const totalBilled = invoice?.totalAmount || 85000;
  const totalPaid = invoice?.paidAmount || 50000;
  const totalPending = Math.max(0, totalBilled - totalPaid);

  return (
    <div className="space-y-6 text-xs text-zinc-900 font-sans max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-base font-bold text-zinc-900 tracking-tight">
            Fee Invoices & Payment Ledger
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">
            Rajarajeswari College of Engineering • Financial Accounts
          </p>
        </div>

        {totalPending > 0 && (
          <button
            onClick={() => setPayModalOpen(true)}
            className="self-start sm:self-auto bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pay Pending Fee</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 rounded border bg-emerald-50 text-emerald-900 border-emerald-200 text-xs flex items-center justify-between font-medium">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            {message}
          </span>
          <button onClick={() => setMessage(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* FINANCIAL STATEMENT SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 bg-white shadow-xs">
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Total Billed</span>
          <span className="text-lg font-bold font-mono text-zinc-900">{formatINR(totalBilled)}</span>
        </div>
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Total Paid</span>
          <span className="text-lg font-bold font-mono text-emerald-700">{formatINR(totalPaid)}</span>
        </div>
        <div className="p-4 space-y-1">
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">Outstanding Balance</span>
          <span className="text-lg font-bold font-mono text-amber-700">{formatINR(totalPending)}</span>
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-xs space-y-0">
        <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-2">
          <span className="font-semibold text-zinc-900 text-xs">
            Itemized Fee Breakdown
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Academic Year 2025-26
          </span>
        </div>

        <div className="w-full overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="min-w-[640px] w-full text-left border-collapse">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider text-[11px] font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3">Invoice ID</th>
                <th className="py-2.5 px-3">Fee Description</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {feeItems.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-zinc-900">{item.id}</td>
                  <td className="py-2.5 px-3 font-medium text-zinc-800">{item.desc}</td>
                  <td className="py-2.5 px-3 text-zinc-500">{item.due}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                    {formatINR(item.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                      item.status === "Paid"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-semibold text-sm text-zinc-900">Pay Pending Tuition Fee</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSimulatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Amount to Pay (INR)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  max={totalPending}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="px-4 py-1.5 rounded bg-zinc-900 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {paying ? "Processing..." : "Confirm & Pay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
