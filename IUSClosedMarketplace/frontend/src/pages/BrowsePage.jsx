import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BrowsePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [priceRange, setPriceRange] = useState('all');

  const categories = [
    { id: 1, name: 'Electronics' }, { id: 2, name: 'Books' }, { id: 3, name: 'Furniture' },
    { id: 4, name: 'Clothing' }, { id: 5, name: 'Sports' }, { id: 6, name: 'Other' },
  ];

  useEffect(() => {
    loadListings();
    loadFavorites();
  }, []);

  const loadListings = async () => {
    try {
      const params = {};
      if (search) params.keyword = search;
      if (categoryId) params.categoryId = categoryId;
      if (sortBy) params.sortBy = sortBy;
      if (priceRange === '0-50') { params.minPrice = 0; params.maxPrice = 50; }
      else if (priceRange === '50-200') { params.minPrice = 50; params.maxPrice = 200; }
      else if (priceRange === '200+') { params.minPrice = 200; }

      const res = await listingsApi.search(params);
      setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const res = await listingsApi.getFavorites();
      setFavorites(res.data.map((l) => l.id));
    } catch { }
  };

  useEffect(() => {
    const timeout = setTimeout(loadListings, 300);
    return () => clearTimeout(timeout);
  }, [search, categoryId, sortBy, priceRange]);

  const toggleFav = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await listingsApi.toggleFavorite(id);
      if (res.data.isFavorited) {
        setFavorites([...favorites, id]);
      } else {
        setFavorites(favorites.filter((f) => f !== id));
      }
    } catch { }
  };

  const isFav = (id) => favorites.includes(id);

  return (
    <>
      <div className="page-header">
        <h2>Browse Marketplace</h2>
        <p>Find what you need from the IUS community</p>
      </div>
      <div className="page-body fade-in">
        <div className="filters-bar">
          <div className="search-box">
            <span style={{ color: 'var(--text3)' }}>🔍</span>
            <input placeholder="Search listings..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
            <option value="all">Any Price</option>
            <option value="0-50">Under 50 KM</option>
            <option value="50-200">50–200 KM</option>
            <option value="200+">200+ KM</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="latest">Latest</option>
            <option value="price-low">Price: Low → High</option>
            <option value="price-high">Price: High → Low</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : listings.length === 0 ? (
          <div className="empty-state"><div className="icon">🔍</div><p>No listings found</p></div>
        ) : (
          <div className="listings-grid">
            {listings.map((l) => (
              <div key={l.id} className="card listing-card" onClick={() => navigate(`/listings/${l.id}`)}>
                <div className="listing-thumb">
                  📦
                  <span className="condition-badge">{l.condition}</span>
                  <button className={`fav-btn ${isFav(l.id) ? 'active' : ''}`} onClick={(e) => toggleFav(e, l.id)}>
                    {isFav(l.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <div className="listing-info">
                  <div className="title">{l.title}</div>
                  <div className="meta">
                    <span className="price">{l.price} KM</span>
                    <span className="cat">{l.categoryName}</span>
                  </div>
                  <div className="seller">by {l.sellerName}</div>
                  <div className="date">{new Date(l.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
