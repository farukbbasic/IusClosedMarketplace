import { useState, useEffect } from 'react';
import { transactionsApi, listingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [availableListings, setAvailableListings] = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await transactionsApi.getMine();
      setTransactions(res.data);
    } catch { } finally { setLoading(false); }
  };

  const openPurchaseModal = async () => {
    try {
      const res = await listingsApi.getAll();
      setAvailableListings(res.data.filter((l) => l.sellerId !== user?.userId));
      setShowModal(true);
    } catch { }
  };

  const completePurchase = async (listingId) => {
    try {
      await transactionsApi.create({ listingId });
      showToast('Transaction completed!');
      setShowModal(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  return (
    <>
      <div className="page-header"><h2>Transactions</h2><p>Your purchase and sale history</p></div>
      <div className="page-body fade-in">
        <button className="btn btn-primary" style={{ marginBottom: 16 }} onClick={openPurchaseModal}>
          ✓ Complete a Purchase
        </button>
        {loading ? <p>Loading...</p> : transactions.length === 0 ? (
          <div className="empty-state"><div className="icon">🧾</div><p>No transactions yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Buyer</th><th>Seller</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td>📦 {t.listingTitle}</td>
                    <td>{t.buyerName}</td>
                    <td>{t.sellerName}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{t.amount} KM</td>
                    <td style={{ color: 'var(--text3)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showModal && (
        <Modal title="Complete a Purchase" onClose={() => setShowModal(false)}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Select a listing you've purchased:</p>
          {availableListings.length === 0 ? <p style={{ color: 'var(--text3)' }}>No listings available</p> :
            availableListings.map((l) => (
              <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>📦 {l.title} — <strong>{l.price} KM</strong></span>
                <button className="btn btn-primary btn-sm" onClick={() => completePurchase(l.id)}>Complete</button>
              </div>
            ))}
        </Modal>
      )}
    </>
  );
}
