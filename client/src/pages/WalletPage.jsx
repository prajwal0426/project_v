import { CircleDollarSign, Wallet } from 'lucide-react';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import PageIntro from '../components/PageIntro.jsx';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useApiResource from '../hooks/useApiResource.js';

function money(value) {
  return `₹${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function WalletPage() {
  const { token } = useAuth();
  const { wallet, loadWallet } = useAppData();
  const { loading, error } = useApiResource(() => loadWallet(token), [token]);
  const transactions = Array.isArray(wallet?.transactions) ? wallet.transactions : [];

  return (
    <section className="page">
      <PageIntro icon={Wallet} title="Wallet" text="Track real coin and rupee balances from the database." />
      {loading ? <LoadingState label="Loading wallet..." /> : null}
      {error ? <EmptyState title="Wallet unavailable" message={error} /> : null}
      <div className="wallet-layout">
        <section className="wallet-card glass">
          <CircleDollarSign />
          <span>Coin Balance</span>
          <strong>{Number(wallet?.coins ?? 0).toLocaleString()} coins</strong>
          <p>1 VERTEX Coin = ₹2.50</p>
          <h2>{money(wallet?.inr)}</h2>
          <div className="wallet-summary">
            <span>Rupee Balance (₹)<b>{money(wallet?.inr)}</b></span>
            <span>Total Earnings (₹)<b>{money(wallet?.inr)}</b></span>
            <span>Available Balance (₹)<b>{money(wallet?.inr)}</b></span>
            <span>Pending Balance (₹)<b>{money(wallet?.pendingInr)}</b></span>
            <span>Withdrawal Amount (₹)<b>{money(0)}</b></span>
          </div>
        </section>
        <section className="panel glass">
          <h3>Transaction History</h3>
          {!transactions.length ? <EmptyState title="No transactions yet" /> : null}
          {transactions.map((tx) => (
            <div className="transaction" key={tx?.id || `${tx?.type}-${tx?.created_at}`}>
              <span>{tx?.type || 'transaction'}</span>
              <b>{Number(tx?.coin_amount ?? 0).toLocaleString()} coins</b>
              <small>{money(tx?.inr_amount)}</small>
              <small>{tx?.status || 'pending'}</small>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}
