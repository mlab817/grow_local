import React, { useEffect, useState } from 'react';
import {
  PosCheckoutResult,
  TransactionDTO,
  UserDTO,
  VoucherDTO,
} from '@growlocal/shared';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';

type AdminTab = 'pos' | 'transactions' | 'vouchers';

export function AdminDashboard() {
  const { user, tenant, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('pos');

  // POS Form States
  const [customerEmailOrCode, setCustomerEmailOrCode] = useState('');
  const [customerFullName, setCustomerFullName] = useState('');
  const [billAmountPesos, setBillAmountPesos] = useState<string>('');
  const [posLoading, setPosLoading] = useState(false);
  const [posResult, setPosResult] = useState<PosCheckoutResult | null>(null);
  const [posError, setPosError] = useState<string | null>(null);

  // Data lists
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [clients, setClients] = useState<UserDTO[]>([]);
  const [vouchers, setVouchers] = useState<VoucherDTO[]>([]);
  const [voucherSuccess, setVoucherSuccess] = useState<string | null>(null);
  const [voucherOfferText, setVoucherOfferText] = useState('');

  const loadData = () => {
    apiFetch<{ transactions: TransactionDTO[] }>('/api/admin/transactions', {}, token)
      .then((res) => setTransactions(res.transactions))
      .catch(console.error);

    apiFetch<{ clients: UserDTO[] }>('/api/admin/clients', {}, token)
      .then((res) => setClients(res.clients))
      .catch(console.error);

    apiFetch<{ vouchers: VoucherDTO[] }>('/api/admin/vouchers', {}, token)
      .then((res) => setVouchers(res.vouchers))
      .catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handlePosSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosError(null);
    setPosResult(null);

    const billAmountCents = Math.round(parseFloat(billAmountPesos || '0') * 100);
    if (isNaN(billAmountCents) || billAmountCents <= 0) {
      setPosError('Please enter a valid bill amount');
      return;
    }

    setPosLoading(true);
    try {
      const res = await apiFetch<PosCheckoutResult>(
        '/api/admin/pos/checkout',
        {
          method: 'POST',
          body: JSON.stringify({
            customerEmailOrCode: customerEmailOrCode.trim(),
            customerFullName: customerFullName.trim() || undefined,
            billAmountCents,
          }),
        },
        token
      );
      setPosResult(res);
      setBillAmountPesos('');
      loadData();
    } catch (err) {
      setPosError((err as Error).message);
    } finally {
      setPosLoading(false);
    }
  };

  const handleIssueVoucher = async (clientId: string) => {
    setVoucherSuccess(null);
    try {
      const res = await apiFetch<{ voucher: VoucherDTO }>(
        '/api/admin/vouchers',
        {
          method: 'POST',
          body: JSON.stringify({ clientId, offerText: voucherOfferText, daysValid: 30 }),
        },
        token
      );
      setVoucherSuccess(`Issued voucher ${res.voucher.code} successfully!`);
      setVoucherOfferText('');
      loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">
              Cashier & Owner Terminal
            </span>
            {tenant && (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {tenant.name} ({tenant.town})
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold">GrowLocal Counter Terminal</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-200 block font-medium">{user?.fullName}</span>
            <span className="text-[11px] text-slate-400">{user?.email}</span>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-2 border-b border-slate-200 mb-6">
          {(
            [
              { id: 'pos', label: 'Cashier POS & Checkout' },
              { id: 'transactions', label: 'Counter Transactions' },
              { id: 'vouchers', label: 'Vouchers' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Cashier POS */}
        {activeTab === 'pos' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Process Customer Checkout</h2>
              <p className="text-xs text-slate-500 mb-6">
                Record a customer's payment at the counter.
              </p>

              {posError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {posError}
                </div>
              )}

              <form onSubmit={handlePosSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Phone, Email, or Member Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerEmailOrCode}
                    onChange={(e) => setCustomerEmailOrCode(e.target.value)}
                    placeholder="e.g. maria@growlocal.local or 09171234567 or MARIA-001"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Full Name (Optional, if first-time walk-in)
                  </label>
                  <input
                    type="text"
                    value={customerFullName}
                    onChange={(e) => setCustomerFullName(e.target.value)}
                    placeholder="e.g. Juan dela Cruz"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Bill Amount (₱) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={billAmountPesos}
                    onChange={(e) => setBillAmountPesos(e.target.value)}
                    placeholder="500.00"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={posLoading}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer shadow-sm mt-2"
                >
                  {posLoading ? 'Processing Checkout...' : 'Confirm Checkout & Record Transaction'}
                </button>
              </form>
            </div>

            {/* Live POS Receipt / Result */}
            <div>
              {posResult ? (
                <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      ✓
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">Transaction Completed</h3>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Bill Amount:</span>
                      <span className="font-semibold text-slate-900">
                        ₱{(posResult.transaction.billAmountCents / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                      <span>Total Customer Paid:</span>
                      <span>₱{(posResult.finalAmountCents / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {posResult.newCustomerVerified && (
                      <div className="p-2.5 rounded-lg bg-teal-50 text-teal-800">
                        This customer is now recorded as a patron for {tenant?.name}.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                  Transaction details will appear here after checkout.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Transactions */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h2 className="font-semibold text-slate-800">Counter Transactions</h2>
                <p className="text-xs text-slate-500">Recorded register checkouts</p>
              </div>
              <span className="text-xs text-slate-500">{transactions.length} total</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Gross Bill</th>
                  <th className="px-6 py-3">Final Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">
                      No counter transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 font-medium">{t.clientName ?? 'Customer'}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">₱{(t.billAmountCents / 100).toFixed(2)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ₱{(t.finalAmountCents / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Vouchers */}
        {activeTab === 'vouchers' && (
          <div className="space-y-6">
            {voucherSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                {voucherSuccess}
              </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="font-semibold text-slate-800">Customers</h2>
                <p className="text-xs text-slate-500">
                  Create a shop-defined voucher for a customer. Voucher terms are not calculated by
                  GrowLocal.
                </p>
                <label className="block mt-4 text-xs font-medium text-slate-700">
                  Voucher terms
                  <input
                    type="text"
                    required
                    maxLength={500}
                    value={voucherOfferText}
                    onChange={(event) => setVoucherOfferText(event.target.value)}
                    placeholder="e.g. 10% off rebond (up to ₱100)"
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </label>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Customer Name</th>
                    <th className="px-6 py-3">Email / Contact</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No patrons recorded yet. Check out a customer at the POS to see them here.
                      </td>
                    </tr>
                  ) : (
                    clients.map((c) => (
                      <tr key={c.id}>
                        <td className="px-6 py-4 font-medium text-slate-900">{c.fullName}</td>
                        <td className="px-6 py-4 text-slate-600 text-xs">{c.email}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleIssueVoucher(c.id)}
                            disabled={!voucherOfferText.trim()}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition cursor-pointer"
                          >
                            Issue Voucher
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {vouchers.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-800">Vouchers Issued</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {vouchers.map((v) => (
                    <div key={v.id} className="p-4 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-800 mr-2">
                          {v.code}
                        </span>
                        <span className="text-slate-500">— {v.offerText}</span>
                        <p className="text-slate-500 mt-0.5">
                          Issued to: {v.clientName ?? v.clientEmail} • Valid until:{' '}
                          {new Date(v.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          v.redeemedAt
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {v.redeemedAt ? 'Redeemed' : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
