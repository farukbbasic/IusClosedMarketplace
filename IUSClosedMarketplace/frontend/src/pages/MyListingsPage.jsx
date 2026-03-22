import { useState, useEffect } from 'react';
import { listingsApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';

const CATEGORIES = [
  { id: 1, name: 'Electronics' }, { id: 2, name: 'Books' }, { id: 3, name: 'Furniture' },
  { id: 4, name: 'Clothing' }, { id: 5, name: 'Sports' }, { id: 6, name: 'Other' },
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export default function MyListingsPage() {
  const { showToast } = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', price: '', categoryId: 1, condition: 'New' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await listingsApi.getMyListings();
      setListings(res.data);
    } catch { } finally { setLoading(false); }
  };

  const openCreate = () => {
    setForm({ title: '', description: '', price: '', categoryId: 1, condition: 'New' });
    setModal('create');
  };

  const openEdit = (l) => {
    setEditItem(l);
    setForm({ title: l.title, description: l.description, price: l.price, categoryId: l.categoryId, condition: l.condition });
    setModal('edit');
  };

  const save = async () => {
    if (!form.title || !form.price) return;
    try {
      if (modal === 'create') {
        await listingsApi.create({ ...form, price: Number(form.price), categoryId: Number(form.categoryId) });
        showToast('Listing created!');
      } else {
        await listingsApi.update(editItem.id, { ...form, price: Number(form.price), categoryId: Number(form.categoryId) });
        showToast('Listing updated!');
      }
      setModal(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    }
  };

  const deleteListing = async (id) => {
    try {
      await listingsApi.delete(id);
      showToast('Listing removed');
      load();
    } catch { }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h2>My Listings</h2><p>Manage your items for sale</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ New Listing</button>
      </div>
      <div className="page-body fade-in">
        {loading ? <p>Loading...</p> : listings.filter((l) => l.isActive).length === 0 ? (
          <div className="empty-state"><div className="icon">📦</div><p>You haven't listed anything yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Condition</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {listings.filter((l) => l.isActive).map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500 }}>📦 {l.title}</td>
                    <td>{l.categoryName}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{l.price} KM</td>
                    <td>{l.condition}</td>
                    <td style={{ color: 'var(--text3)' }}>{new Date(l.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(l)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteListing(l.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'create' ? 'New Listing' : 'Edit Listing'} onClose={() => setModal(null)} footer={
          <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>{modal === 'create' ? 'Create' : 'Save'}</button></>
        }>
          <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Item name" /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your item..." /></div>
          <div className="form-row">
            <div className="form-group"><label>Price (KM)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="form-group"><label>Category</label><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="form-group"><label>Condition</label><select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>{CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
        </Modal>
      )}
    </>
  );
}
