import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await usersApi.getAll();
      setUsers(res.data);
    } catch { } finally { setLoading(false); }
  };

  const toggleBan = async (id) => {
    try {
      await usersApi.toggleBan(id);
      showToast('User status updated');
      load();
    } catch { }
  };

  return (
    <>
      <div className="page-header"><h2>User Management</h2><p>Manage registered users</p></div>
      <div className="page-body fade-in">
        {loading ? <p>Loading...</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: 'var(--text3)' }}>{u.email}</td>
                    <td><span className={`badge-role badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                    <td>{u.isBanned ? <span className="badge-role badge-banned">Banned</span> : <span className="badge-role badge-resolved">Active</span>}</td>
                    <td style={{ color: 'var(--text3)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.id !== currentUser?.userId && (
                        <button className={`btn btn-sm ${u.isBanned ? 'btn-secondary' : 'btn-danger'}`} onClick={() => toggleBan(u.id)}>
                          {u.isBanned ? '✓ Unban' : '🚫 Ban'}
                        </button>
                      )}
                    </td>
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
