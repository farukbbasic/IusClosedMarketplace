import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingsApi } from '../services/api';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listingsApi.getFavorites()
      .then((res) => setListings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeFav = async (e, id) => {
    e.stopPropagation();
    await listingsApi.toggleFavorite(id);
    setListings(listings.filter((l) => l.id !== id));
  };

  return (
    <>
      <div className="page-header"><h2>Favorites</h2><p>Items you've saved for later</p></div>
      <div className="page-body fade-in">
        {loading ? <p>Loading...</p> : listings.length === 0 ? (
          <div className="empty-state"><div className="icon">💜</div><p>No saved items yet</p></div>
        ) : (
          <div className="listings-grid">
            {listings.map((l) => (
              <div key={l.id} className="card listing-card" onClick={() => navigate(`/listings/${l.id}`)}>
                <div className="listing-thumb">
                  📦
                  <button className="fav-btn active" onClick={(e) => removeFav(e, l.id)}>❤️</button>
                </div>
                <div className="listing-info">
                  <div className="title">{l.title}</div>
                  <div className="meta"><span className="price">{l.price} KM</span><span className="cat">{l.categoryName}</span></div>
                  <div className="seller">by {l.sellerName}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
