import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingsApi, messagesApi, reportsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Icon from '../components/Icon';

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
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    loadListing();
    checkFavorite();
  }, [id]);

  const loadListing = async () => {
    try {
      const res = await listingsApi.getById(id);
      setListing(res.data);
    } catch {
      showToast('Item not found', 'error');
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
      showToast(res.data.isFavorited ? 'Added to saved' : 'Removed from saved');
    } catch { }
  };

  const messageSeller = async () => {
    try {
      await messagesApi.send({
        receiverId: listing.sellerId,
        listingId: listing.id,
        content: `Hi! I'm interested in "${listing.title}"`,
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

  if (loading) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="loading-spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }
  if (!listing) return null;

  const isOwn = user?.userId === listing.sellerId;
  const images = (() => { try { return JSON.parse(listing.imageUrls || '[]'); } catch { return []; } })();

  return (
    <>
      <div className="page-header">
        <button
          className="btn btn-ghost"
          onClick={() => navigate(-1)}
          style={{ fontSize: '0.75rem', gap: 4 }}
        >
          <Icon name="arrowLeft" size={13} />
          Back
        </button>
        <div className="page-header-text">
          <h2>{listing.title}</h2>
        </div>
      </div>

      <div className="page-body fade-in">
        <div className="detail-layout">
          <div>
            <div className="detail-image">
              {images.length > 0
                ? <img src={images[activeImg]} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }} />
                : <Icon name="package" size={64} />
              }
            </div>
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {images.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveImg(i)}
                    style={{
                      width: 56, height: 56, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                      border: `2px solid ${i === activeImg ? 'var(--accent)' : 'var(--border)'}`,
                      flexShrink: 0,
                    }}
                  >
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="detail-info">
            <h2>{listing.title}</h2>
            <div className="detail-price">{listing.price} KM</div>
            <div className="detail-meta">
              <div className="detail-meta-item">
                <Icon name="tag" size={14} />
                {listing.categoryName}
              </div>
              <div className="detail-meta-item">
                <Icon name="star" size={14} />
                {listing.condition}
              </div>
              <div className="detail-meta-item">
                <Icon name="user" size={14} />
                {listing.sellerName}
              </div>
              <div className="detail-meta-item">
                <Icon name="calendar" size={14} />
                {new Date(listing.createdAt).toLocaleDateString()}
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text2)', lineHeight: 1.65, marginBottom: 22 }}>
              {listing.description}
            </p>
            <div className="detail-actions">
              {!isOwn && (
                <button className="btn btn-primary" onClick={messageSeller}>
                  <Icon name="messageSquare" size={14} />
                  Message Seller
                </button>
              )}
              <button className={`btn ${isFav ? 'btn-danger' : 'btn-secondary'}`} onClick={toggleFav}>
                <Icon name={isFav ? 'heartFilled' : 'heart'} size={14} />
                {isFav ? 'Saved' : 'Save'}
              </button>
              {!isOwn && (
                <button className="btn btn-ghost" onClick={() => setReportModal(true)}>
                  <Icon name="flag" size={14} />
                  Report
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {reportModal && (
        <Modal
          title={`Report listing`}
          onClose={() => setReportModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setReportModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={submitReport}>
                <Icon name="flag" size={13} />
                Submit Report
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Reason for reporting</label>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
            />
          </div>
        </Modal>
      )}
    </>
  );
}
