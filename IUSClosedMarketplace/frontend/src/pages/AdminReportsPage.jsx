import { useState, useEffect } from 'react';
import { reportsApi } from '../services/api';
import { useToast } from '../context/ToastContext';

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
      <div className="page-header"><h2>Reports & Moderation</h2><p>Review flagged content</p></div>
      <div className="page-body fade-in">
        <div className="tabs">
          <button className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
            Pending ({reports.filter((r) => r.status === 'Pending').length})
          </button>
          <button className={`tab ${tab === 'resolved' ? 'active' : ''}`} onClick={() => setTab('resolved')}>Resolved</button>
        </div>
        {loading ? <p>Loading...</p> : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">✅</div><p>No {tab} reports</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Listing</th><th>Reporter</th><th>Reason</th><th>Date</th><th>Status</th>{tab === 'pending' && <th>Actions</th>}</tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>📦 {r.listingTitle}</td>
                    <td>{r.reporterName}</td>
                    <td style={{ maxWidth: 200 }} className="truncate">{r.reason}</td>
                    <td style={{ color: 'var(--text3)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge-role ${r.status === 'Pending' ? 'badge-pending' : 'badge-resolved'}`}>{r.status}</span></td>
                    {tab === 'pending' && (
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleAction(r.id, 'dismiss')}>✓ Ignore</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(r.id, 'removelisting')}>🗑️ Remove</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleAction(r.id, 'banuser')}>🚫 Ban</button>
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
