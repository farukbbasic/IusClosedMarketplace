import { useState, useEffect } from 'react';
import { transactionsApi, listingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Icon from '../components/Icon';

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
      <div className="page-header">
        <div className="page-header-text">
          <h2>Transactions</h2>
          <p>Your purchase and sale history</p>
        </div>
        <button className="btn btn-primary" onClick={openPurchaseModal}>
          <Icon name="shoppingBag" size={14} />
          Complete a Purchase
        </button>
      </div>

      <div className="page-body fade-in">
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><Icon name="fileText" size={22} /></div>
            <h3>No transactions yet</h3>
            <p>Completed purchases will appear here</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Buyer</th>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.listingTitle}</td>
                    <td style={{ color: 'var(--text2)' }}>{t.buyerName}</td>
                    <td style={{ color: 'var(--text2)' }}>{t.sellerName}</td>
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
          <p style={{ fontSize: '0.8125rem', color: 'var(--text2)', marginBottom: 16 }}>
            Select an item you purchased:
          </p>
          {availableListings.length === 0 ? (
            <p style={{ color: 'var(--text3)', fontSize: '0.8125rem' }}>No listings available</p>
          ) : (
            availableListings.map((l) => (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="package" size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8125rem' }}>
                    {l.title} — <strong style={{ color: 'var(--accent)' }}>{l.price} KM</strong>
                  </span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => completePurchase(l.id)}>
                  Complete
                </button>
              </div>
            ))
          )}
        </Modal>
      )}
    </>
  );
}
