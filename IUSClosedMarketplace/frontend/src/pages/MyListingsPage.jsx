import { useState, useEffect } from 'react';
import { listingsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import Icon from '../components/Icon';

const CATEGORIES = [
  { id: 1, name: 'Electronics' }, { id: 2, name: 'Books' }, { id: 3, name: 'Furniture' },
  { id: 4, name: 'Clothing' }, { id: 5, name: 'Sports' }, { id: 6, name: 'Other' },
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const parseImages = (imageUrls) => {
  try { return JSON.parse(imageUrls || '[]'); } catch { return []; }
};

export default function MyListingsPage() {
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', categoryId: 1, condition: 'New' });
  const [pendingFiles, setPendingFiles] = useState([]);
  const [existingUrls, setExistingUrls] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const urls = pendingFiles.map(f => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [pendingFiles]);

  const load = async () => {
    try {
      const res = await listingsApi.getMyListings();
      setListings(res.data);
    } catch { } finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ title: '', description: '', price: '', categoryId: 1, condition: 'New' });
    setPendingFiles([]);
    setExistingUrls([]);
    setEditItem(null);
    setModal('create');
  };

  const openEdit = (l) => {
    setEditItem(l);
    setForm({ title: l.title, description: l.description, price: l.price, categoryId: l.categoryId, condition: l.condition });
    setPendingFiles([]);
    setExistingUrls(parseImages(l.imageUrls));
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setPendingFiles([]);
    setExistingUrls([]);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxBytes = 5 * 1024 * 1024;
    const total = existingUrls.length + pendingFiles.length;

    const valid = newFiles.filter(f => {
      if (!allowed.includes(f.type)) { showToast(`${f.name}: not a supported image`, 'error'); return false; }
      if (f.size > maxBytes) { showToast(`${f.name}: exceeds 5 MB limit`, 'error'); return false; }
      return true;
    });

    const canAdd = 5 - total;
    if (valid.length > canAdd) showToast('Max 5 photos per listing', 'error');
    if (canAdd > 0) setPendingFiles(prev => [...prev, ...valid.slice(0, canAdd)]);
    e.target.value = '';
  };

  const removeExisting = (i) => setExistingUrls(prev => prev.filter((_, idx) => idx !== i));
  const removePending = (i) => setPendingFiles(prev => prev.filter((_, idx) => idx !== i));

  const save = async () => {
    if (!form.title || !form.price) return showToast('Title and price are required', 'error');
    if (modal === 'create' && existingUrls.length + pendingFiles.length === 0)
      return showToast('At least one photo is required', 'error');

    setSaving(true);
    try {
      let newUrls = [];
      if (pendingFiles.length > 0) {
        const res = await listingsApi.uploadImages(pendingFiles);
        newUrls = res.data;
      }
      const payload = {
        ...form,
        price: Number(form.price),
        categoryId: Number(form.categoryId),
        imageUrls: JSON.stringify([...existingUrls, ...newUrls]),
      };

      if (modal === 'create') {
        await listingsApi.create(payload);
        showToast('Item posted!');
      } else {
        await listingsApi.update(editItem.id, payload);
        showToast('Item updated!');
      }
      closeModal();
      load();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.message
        || (data?.errors ? Object.values(data.errors).flat().join(', ') : null)
        || data?.title
        || 'Failed to save';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteListing = async (id) => {
    try {
      await listingsApi.delete(id);
      showToast('Item removed');
      load();
    } catch { }
  };

  const activeListings = listings.filter((l) => l.isActive);
  const totalPhotos = existingUrls.length + pendingFiles.length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-text">
          <h2>My Items</h2>
          <p>Manage your items for sale</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Icon name="plus" size={14} />
          New Item
        </button>
      </div>

      <div className="page-body fade-in">
        {loading ? (
          <div className="empty-state">
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : activeListings.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><Icon name="package" size={22} /></div>
            <h3>Nothing posted yet</h3>
            <p>Create your first listing to start selling</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Condition</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeListings.map((l) => {
                  const imgs = parseImages(l.imageUrls);
                  return (
                    <tr key={l.id}>
                      <td>
                        {imgs.length > 0
                          ? <img src={imgs[0]} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                          : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--border2)' }}><Icon name="package" size={18} /></div>
                        }
                      </td>
                      <td style={{ fontWeight: 500 }}>{l.title}</td>
                      <td style={{ color: 'var(--text2)' }}>{l.categoryName}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{l.price} KM</td>
                      <td style={{ color: 'var(--text2)' }}>{l.condition}</td>
                      <td style={{ color: 'var(--text3)' }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(l)}>
                            <Icon name="pencil" size={12} />
                            Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteListing(l.id)} title="Delete listing">
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === 'create' ? 'New Item' : 'Edit Item'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving
                  ? <><div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Uploading...</>
                  : modal === 'create' ? 'Post Item' : 'Save Changes'
                }
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Item name" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your item..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (KM)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Condition</label>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Photos
              {modal === 'create' && <span style={{ color: 'var(--red)', fontSize: '0.7rem', fontWeight: 400 }}>required</span>}
              <span style={{ color: 'var(--text3)', fontSize: '0.7rem', fontWeight: 400, marginLeft: 'auto' }}>{totalPhotos}/5</span>
            </label>
            <div className="photo-upload-area">
              {existingUrls.map((url, i) => (
                <div key={url} className="photo-thumb">
                  <img src={url} alt="" />
                  <button className="photo-remove" type="button" onClick={() => removeExisting(i)}>
                    <Icon name="x" size={10} />
                  </button>
                </div>
              ))}
              {pendingFiles.map((_, i) => (
                <div key={i} className="photo-thumb">
                  <img src={previewUrls[i]} alt="" />
                  <button className="photo-remove" type="button" onClick={() => removePending(i)}>
                    <Icon name="x" size={10} />
                  </button>
                </div>
              ))}
              {totalPhotos < 5 && (
                <label className="photo-add-btn" title="Add photos">
                  <Icon name="plus" size={22} />
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>
              )}
            </div>
            {totalPhotos === 0 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 5 }}>
                Add up to 5 photos. The first photo will be the cover image.
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
