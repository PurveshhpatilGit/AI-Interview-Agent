import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const API_URL = import.meta.env.VITE_API_URL;

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/admin/users`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setUsers(res.data);
    } catch (error) {
      console.log("Fetch users error:", error);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API_URL}/sessions/admin/all`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setSessions(res.data);
    } catch (error) {
      console.log("Fetch sessions error:", error);
    }
  };

  const deleteUser = async (id) => {
    if (id === user?._id) {
      alert("You cannot delete yourself");
      return;
    }

    await axios.delete(`${API_URL}/users/admin/users/${id}`, {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    });

    fetchUsers();
  };

  const deleteSession = async (id) => {
    await axios.delete(`${API_URL}/sessions/admin/${id}`, {
      headers: {
        Authorization: `Bearer ${user?.token}`,
      },
    });

    fetchSessions();
  };

  useEffect(() => {
    if (user?.token) {
      fetchUsers();
      fetchSessions();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-black text-slate-900">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            Welcome admin. Manage users, interviews, and reports here.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm font-bold text-slate-500 uppercase">
              Total Users
            </p>
            <h2 className="text-4xl font-black text-teal-600 mt-2">
              {users.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm font-bold text-slate-500 uppercase">
              Total Sessions
            </p>
            <h2 className="text-4xl font-black text-teal-600 mt-2">
              {sessions.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-6">
            <p className="text-sm font-bold text-slate-500 uppercase">
              Reports
            </p>
            <h2 className="text-4xl font-black text-teal-600 mt-2">0</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-black text-slate-900 mb-4">
            Admin Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setShowUsers(!showUsers);
                setShowSessions(false);
              }}
              className="bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800"
            >
              Manage Users
            </button>

            <button
              onClick={() => {
                setShowSessions(!showSessions);
                setShowUsers(false);
              }}
              className="bg-teal-600 text-white py-4 rounded-xl font-bold hover:bg-teal-700"
            >
              View Sessions
            </button>

            <button className="bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700">
              Reports
            </button>
          </div>
        </div>

        {showUsers && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-black mb-4">Users</h2>

            {users.map((u) => (
              <div
                key={u._id}
                className="flex justify-between items-center border-b py-3"
              >
                <div>
                  <p className="font-bold">{u.name}</p>
                  <p className="text-sm text-slate-500">{u.email}</p>
                  <p className="text-sm text-teal-600">{u.role}</p>
                </div>

                {u._id !== user?._id && (
                  <button
                    onClick={() => deleteUser(u._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showSessions && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-black mb-4">Sessions</h2>

            {sessions.map((s) => (
              <div
                key={s._id}
                className="flex justify-between items-center border-b py-3"
              >
                <div>
                  <p className="font-bold">{s.user?.name || "Unknown User"}</p>
                  <p className="text-sm text-slate-500">{s.role}</p>
                  <p className="text-sm text-teal-600">{s.status}</p>
                </div>

                <button
                  onClick={() => deleteSession(s._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
