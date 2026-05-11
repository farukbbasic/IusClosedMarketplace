import { useState, useEffect } from 'react';
import { transactionsApi } from '../services/api';
import Icon from '../components/Icon';

export default function AdminAnalyticsPage() {
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

  const barColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

  const maxCat = Math.max(...analytics.listingsPerCategory.map((c) => c.count), 1);
  const maxSeller = Math.max(...analytics.mostActiveSellers.map((s) => s.listingCount), 1);
  const maxRev = Math.max(...analytics.monthlyRevenue.map((m) => m.revenue), 1);

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Analytics</h2>
          <p>Platform statistics and insights</p>
        </div>
      </div>

      <div className="page-body fade-in">
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="stat-card-header">
              <div className="label">Total Revenue</div>
              <div className="stat-card-icon"><Icon name="trendingUp" size={15} /></div>
            </div>
            <div className="value">{analytics.totalRevenue} KM</div>
          </div>
          <div className="stat-card green">
            <div className="stat-card-header">
              <div className="label">Avg Item Price</div>
              <div className="stat-card-icon"><Icon name="tag" size={15} /></div>
            </div>
            <div className="value">{Math.round(analytics.averageListingPrice)} KM</div>
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
              <div className="label">Active Items</div>
              <div className="stat-card-icon"><Icon name="package" size={15} /></div>
            </div>
            <div className="value">{analytics.activeListings}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.8125rem', marginBottom: 20, color: 'var(--text2)', fontWeight: 500 }}>
              Items per Category
            </h3>
            <div className="bar-chart">
              {analytics.listingsPerCategory.map((c, i) => (
                <div className="bar-item" key={c.categoryName}>
                  <div className="bar-value">{c.count}</div>
                  <div
                    className="bar"
                    style={{ height: `${(c.count / maxCat) * 160}px`, background: barColors[i % barColors.length] }}
                  />
                  <div className="bar-label">{c.categoryName}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: '0.8125rem', marginBottom: 20, color: 'var(--text2)', fontWeight: 500 }}>
              Most Active Sellers
            </h3>
            <div className="bar-chart">
              {analytics.mostActiveSellers.map((s, i) => (
                <div className="bar-item" key={s.sellerName}>
                  <div className="bar-value">{s.listingCount}</div>
                  <div
                    className="bar"
                    style={{ height: `${(s.listingCount / maxSeller) * 160}px`, background: barColors[(i + 2) % barColors.length] }}
                  />
                  <div className="bar-label">{s.sellerName.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: '0.8125rem', marginBottom: 20, color: 'var(--text2)', fontWeight: 500 }}>
            Monthly Revenue
          </h3>
          {analytics.monthlyRevenue.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text3)' }}>No data yet</p>
          ) : (
            <div className="bar-chart" style={{ height: 150 }}>
              {analytics.monthlyRevenue.map((d, i) => (
                <div className="bar-item" key={d.month}>
                  <div className="bar-value">{d.revenue} KM</div>
                  <div
                    className="bar"
                    style={{ height: `${(d.revenue / maxRev) * 120}px`, background: 'linear-gradient(to top, #3B82F6, #818CF8)' }}
                  />
                  <div className="bar-label">{d.month}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
