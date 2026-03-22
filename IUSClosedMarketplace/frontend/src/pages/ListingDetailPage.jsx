import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingsApi, messagesApi, reportsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    loadListing();
    checkFavorite();
  }, [id]);

  const loadListing = async () => {
    try {
      const res = await listingsApi.getById(id);
      setListing(res.data);
    } catch {
      showToast('Listing not found', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const res = await listingsApi.getFavorites();
      setIsFav(res.data.some((l) => l.id === parseInt(id)));
    } catch { }
  };

  const toggleFav = async () => {
    try {
      const res = await listingsApi.toggleFavorite(id);
      setIsFav(res.data.isFavorited);
      showToast(res.data.isFavorited ? 'Added to favorites' : 'Removed from favorites');
    } catch { }
  };

  const messageSeller = async () => {
    try {
      await messagesApi.send({
        receiverId: listing.sellerId,
        listingId: listing.id,
        content: `Hi! I'm interested in "${listing.title}"`
      });
      showToast('Message sent!');
      navigate('/messages');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send message', 'error');
    }
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await reportsApi.create({ listingId: parseInt(id), reason: reportReason });
      showToast('Report submitted');
      setReportModal(false);
      setReportReason('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit report', 'error');
    }
  };

  if (loading) return <div className="page-body"><p>Loading...</p></div>;
  if (!listing) return null;

  const isOwn = user?.userId === listing.sellerId;

  return (
    <>
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>← Back</button>
        <h2>{listing.title}</h2>
      </div>
      <div className="page-body fade-in">
        <div className="detail-layout">
          <div className="detail-image">📦</div>
          <div className="detail-info">
            <h2>{listing.title}</h2>
            <div className="detail-price">{listing.price} KM</div>
            <div className="detail-meta">
              <div className="detail-meta-item">🏷️ {listing.categoryName}</div>
              <div className="detail-meta-item">⭐ {listing.condition}</div>
              <div className="detail-meta-item">👤 {listing.sellerName}</div>
              <div className="detail-meta-item">📅 {new Date(listing.createdAt).toLocaleDateString()}</div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>{listing.description}</p>
            <div className="detail-actions">
              {!isOwn && (
                <button className="btn btn-primary" onClick={messageSeller}>💬 Message Seller</button>
              )}
              <button className={`btn ${isFav ? 'btn-danger' : 'btn-secondary'}`} onClick={toggleFav}>
                {isFav ? '❤️ Saved' : '🤍 Save'}
              </button>
              {!isOwn && (
                <button className="btn btn-ghost" onClick={() => setReportModal(true)}>🚩 Report</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {reportModal && (
        <Modal title={`Report: ${listing.title}`} onClose={() => setReportModal(false)} footer={
          <>
            <button className="btn btn-secondary" onClick={() => setReportModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={submitReport}>🚩 Submit Report</button>
          </>
        }>
          <div className="form-group">
            <label>Reason for reporting</label>
            <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Describe the issue..." />
          </div>
        </Modal>
      )}
    </>
  );
}
