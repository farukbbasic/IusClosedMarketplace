import { useState, useEffect } from 'react';
import { reportsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Icon from '../components/Icon';

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await reportsApi.getAll();
      setReports(res.data);
    } catch { } finally { setLoading(false); }
  };

  const filtered = reports.filter((r) => tab === 'pending' ? r.status === 'Pending' : r.status !== 'Pending');

  const handleAction = async (id, action) => {
    try {
      await reportsApi.resolve(id, { action });
      showToast('Report updated');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Reports</h2>
          <p>Review flagged content</p>
        </div>
      </div>

      <div className="page-body fade-in">
        <div className="tabs">
          <button className={`tab${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>
            Pending ({reports.filter((r) => r.status === 'Pending').length})
          </button>
          <button className={`tab${tab === 'resolved' ? ' active' : ''}`} onClick={() => setTab('resolved')}>
            Resolved
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><Icon name="checkCircle" size={22} /></div>
            <h3>All clear</h3>
            <p>No {tab} reports</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Reporter</th>
                  <th>Reason</th>
                  <th>Date</th>
                  <th>Status</th>
                  {tab === 'pending' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.listingTitle}</td>
                    <td style={{ color: 'var(--text2)' }}>{r.reporterName}</td>
                    <td style={{ maxWidth: 200, color: 'var(--text2)' }} className="truncate">{r.reason}</td>
                    <td style={{ color: 'var(--text3)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge-role ${r.status === 'Pending' ? 'badge-pending' : 'badge-resolved'}`}>
                        {r.status}
                      </span>
                    </td>
                    {tab === 'pending' && (
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleAction(r.id, 'dismiss')}>
                            <Icon name="check" size={11} />
                            Ignore
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(r.id, 'removelisting')}>
                            <Icon name="trash" size={11} />
                            Remove
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(r.id, 'banuser')}>
                            <Icon name="ban" size={11} />
                            Ban
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
