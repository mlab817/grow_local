import React, { useEffect, useState } from 'react';
import { CustomerShopStatusDTO, TransactionDTO } from '@growlocal/shared';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../api/client';

type CustomerTab = 'shops' | 'transactions';

export function CustomerPortal() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<CustomerTab>('shops');
  const [shops, setShops] = useState<CustomerShopStatusDTO[]>([]);
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);

  useEffect(() => {
    apiFetch<{ shops: CustomerShopStatusDTO[] }>('/api/customer/shops', {}, token)
      .then((res) => setShops(res.shops))
      .catch(console.error);

    apiFetch<{ transactions: TransactionDTO[] }>('/api/customer/transactions', {}, token)
      .then((res) => setTransactions(res.transactions))
      .catch(console.error);
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-emerald-600 font-semibold">
            Member Portal
          </span>
          <h1 className="text-lg font-bold text-slate-900">GrowLocal Marinduque</h1>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-xs font-semibold text-slate-800">{user?.fullName}</p>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Referral rewards are not available yet.
        </div>

        <div className="flex gap-2 border-b border-slate-200 mb-6">
          {(
            [
              { id: 'shops', label: 'Participating Shops in Marinduque' },
              { id: 'transactions', label: 'Transaction History' },
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

        {activeTab === 'shops' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 mb-2">
              Browse participating businesses. Visits are recorded when a cashier completes checkout.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {shops.map((shop) => (
                <div
                  key={shop.tenantId}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm"
                >
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {shop.town} • {shop.category}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base mt-2">{shop.tenantName}</h3>
                  <p className="text-xs text-slate-500 mt-1">{shop.rewardOffer}</p>
                  <p className="text-[11px] text-slate-500 mt-3">
                    {shop.isVerifiedVisitor
                      ? `Visited ${shop.visitCount} time${shop.visitCount === 1 ? '' : 's'}`
                      : 'No visits recorded'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">Counter Transaction History</h2>
            </div>
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No counter transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                    <p className="font-semibold text-slate-900 text-sm">
                      Paid: ₱{(transaction.finalAmountCents / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
