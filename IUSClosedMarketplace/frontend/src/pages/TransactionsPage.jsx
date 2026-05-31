import { useState, useEffect } from 'react';
import { transactionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await transactionsApi.getMine();
      setTransactions(res.data);
    } catch { } finally { setLoading(false); }
  };

  const handleConfirm = async (id) => {
    try {
      await transactionsApi.confirm(id);
      showToast('Sale confirmed! Listing removed from browse.');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm', 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await transactionsApi.reject(id);
      showToast('Request declined.');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to decline', 'error');
    }
  };

  const statusBadge = (status) => {
    const map = {
      Pending: 'badge-pending',
      Confirmed: 'badge-confirmed',
      Rejected: 'badge-rejected',
    };
    return <span className={`badge-status ${map[status] || ''}`}>{status}</span>;
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Transactions</h2>
          <p>Your purchase requests and sales</p>
        </div>
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
            <p>Purchase requests and sales will appear here</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Role</th>
                  <th>Other Party</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const isBuyer = t.buyerId === user?.id;
                  const isPending = t.status === 'Pending';
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 500 }}>{t.listingTitle}</td>
                      <td>
                        <span className={`badge-role ${isBuyer ? 'badge-buyer' : 'badge-seller'}`}>
                          {isBuyer ? 'Buying' : 'Selling'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text2)' }}>
                        {isBuyer ? t.sellerName : t.buyerName}
                      </td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{t.amount} KM</td>
                      <td>{statusBadge(t.status)}</td>
                      <td style={{ color: 'var(--text3)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        {!isBuyer && isPending && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(t.id)}>
                              <Icon name="check" size={12} />
                              Confirm
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(t.id)}>
                              <Icon name="x" size={12} />
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
