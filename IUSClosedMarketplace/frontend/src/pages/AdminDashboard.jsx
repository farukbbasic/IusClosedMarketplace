import { useState, useEffect } from 'react';
import { transactionsApi } from '../services/api';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionsApi.getAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-body"><p>Loading...</p></div>;
  if (!analytics) return <div className="page-body"><p>Failed to load analytics</p></div>;

  return (
    <>
      <div className="page-header"><h2>Admin Dashboard</h2><p>System overview</p></div>
      <div className="page-body fade-in">
        <div className="stats-grid">
          <div className="stat-card blue"><div className="label">Total Users</div><div className="value">{analytics.totalUsers}</div></div>
          <div className="stat-card green"><div className="label">Active Listings</div><div className="value">{analytics.activeListings}</div></div>
          <div className="stat-card amber"><div className="label">Pending Reports</div><div className="value">{analytics.pendingReports}</div></div>
          <div className="stat-card purple"><div className="label">Transactions</div><div className="value">{analytics.totalTransactions}</div><div className="sub">{analytics.totalRevenue} KM total</div></div>
        </div>
      </div>
    </>
  );
}
