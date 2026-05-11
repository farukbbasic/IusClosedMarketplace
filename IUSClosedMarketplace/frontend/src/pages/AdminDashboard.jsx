import { useState, useEffect } from 'react';
import { transactionsApi } from '../services/api';
import Icon from '../components/Icon';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionsApi.getAnalytics()
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="icon"><Icon name="alertTriangle" size={22} /></div>
          <p>Failed to load analytics</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Dashboard</h2>
          <p>System overview</p>
        </div>
      </div>
      <div className="page-body fade-in">
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-card-header">
              <div className="label">Total Users</div>
              <div className="stat-card-icon"><Icon name="users" size={15} /></div>
            </div>
            <div className="value">{analytics.totalUsers}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-card-header">
              <div className="label">Active Items</div>
              <div className="stat-card-icon"><Icon name="package" size={15} /></div>
            </div>
            <div className="value">{analytics.activeListings}</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-card-header">
              <div className="label">Pending Reports</div>
              <div className="stat-card-icon"><Icon name="flag" size={15} /></div>
            </div>
            <div className="value">{analytics.pendingReports}</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-card-header">
              <div className="label">Transactions</div>
              <div className="stat-card-icon"><Icon name="fileText" size={15} /></div>
            </div>
            <div className="value">{analytics.totalTransactions}</div>
            <div className="sub">{analytics.totalRevenue} KM total revenue</div>
          </div>
        </div>
      </div>
    </>
  );
}
