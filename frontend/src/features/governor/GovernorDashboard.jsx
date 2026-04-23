import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, FileWarning, LogOut, RefreshCw, Search } from "lucide-react";
import {
  getGovernorAnalytics,
  getGovernorHeatmap,
  getGovernorReports,
} from "../../services/governorService";
import { getUsers, toggleUserStatus, updateUserById } from "../../services/userService";

const GovernorDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reportFilters, setReportFilters] = useState({
    status: "",
    category: "",
    urgency: "",
    fromDate: "",
    toDate: "",
  });
  const [userRoleFilter, setUserRoleFilter] = useState("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [analyticsRes, reportsRes, heatmapRes, usersRes] = await Promise.all([
        getGovernorAnalytics(),
        getGovernorReports(reportFilters),
        getGovernorHeatmap(reportFilters),
        getUsers({ role: userRoleFilter || undefined, limit: 50, page: 1 }),
      ]);

      setAnalytics(analyticsRes?.data || null);
      setReports(reportsRes?.data || []);
      setHeatmapData(heatmapRes?.data || []);
      setUsers(usersRes?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load governor dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [
    reportFilters.status,
    reportFilters.category,
    reportFilters.urgency,
    reportFilters.fromDate,
    reportFilters.toDate,
    userRoleFilter,
  ]);

  const handleUserActivation = async (userId) => {
    try {
      setMessage("");
      setError("");
      await toggleUserStatus(userId);
      setMessage("User status updated successfully");
      await loadDashboard();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update user status");
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      setMessage("");
      setError("");
      await updateUserById(userId, { role });
      setMessage("User role updated successfully");
      await loadDashboard();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update user role");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.assign("/");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Governor Dashboard</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {user?.fullName || "City Governor"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 py-8 space-y-6">
        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Reports (24h)"
            value={analytics?.reportsLast24Hours ?? 0}
            icon={<FileWarning className="w-5 h-5 text-indigo-600" />}
          />
          <StatCard
            title="Pending"
            value={analytics?.statusBreakdown?.PENDING ?? 0}
            icon={<FileWarning className="w-5 h-5 text-amber-600" />}
          />
          <StatCard
            title="In Progress"
            value={analytics?.statusBreakdown?.IN_PROGRESS ?? 0}
            icon={<RefreshCw className="w-5 h-5 text-blue-600" />}
          />
          <StatCard
            title="Resolved Avg (hrs)"
            value={analytics?.averageResolutionTime?.hours ?? 0}
            icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}
          />
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Reports Situation Room</h2>
          <div className="grid md:grid-cols-6 gap-3 mb-4">
            <select
              value={reportFilters.status}
              onChange={(e) => setReportFilters((p) => ({ ...p, status: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="VALID">VALID</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="SPAM">SPAM</option>
            </select>
            <input
              placeholder="Category"
              value={reportFilters.category}
              onChange={(e) => setReportFilters((p) => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <select
              value={reportFilters.urgency}
              onChange={(e) => setReportFilters((p) => ({ ...p, urgency: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">All Urgencies</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
            <input
              type="date"
              value={reportFilters.fromDate}
              onChange={(e) => setReportFilters((p) => ({ ...p, fromDate: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={reportFilters.toDate}
              onChange={(e) => setReportFilters((p) => ({ ...p, toDate: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              onClick={loadDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white text-sm px-3 py-2"
            >
              <Search className="w-4 h-4" /> Apply
            </button>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-200">
                  <th className="py-2 pr-2">Category</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Urgency</th>
                  <th className="py-2 pr-2">Citizen</th>
                  <th className="py-2 pr-2">Technician</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report._id} className="border-b border-slate-100">
                    <td className="py-2 pr-2">{report.category}</td>
                    <td className="py-2 pr-2">{report.status}</td>
                    <td className="py-2 pr-2">{report.urgency}</td>
                    <td className="py-2 pr-2">{report.citizen?.fullName || "-"}</td>
                    <td className="py-2 pr-2">{report.assignedTechnician?.fullName || "-"}</td>
                  </tr>
                ))}
                {!reports.length && !loading && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid xl:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">System Users Management</h2>
            <div className="mb-3">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">All Roles</option>
                <option value="CITIZEN">CITIZEN</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="GOVERNOR">GOVERNOR</option>
              </select>
            </div>
            <div className="space-y-3 max-h-[440px] overflow-auto pr-1">
              {users.map((u) => (
                <div key={u._id} className="border border-slate-200 rounded-xl p-3">
                  <div className="flex justify-between items-center gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.phoneNumber}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        u.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {u.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="rounded-lg border border-slate-300 px-2 py-2 text-xs"
                    >
                      <option value="CITIZEN">CITIZEN</option>
                      <option value="TECHNICIAN">TECHNICIAN</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="GOVERNOR">GOVERNOR</option>
                    </select>
                    <button
                      onClick={() => handleUserActivation(u._id)}
                      className="rounded-lg bg-slate-900 text-white text-xs px-3 py-2"
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              ))}
              {!users.length && !loading && (
                <p className="text-sm text-slate-500">No users found.</p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Heatmap Data Preview</h2>
            <p className="text-sm text-slate-500 mb-3">
              Total map points: <span className="font-semibold text-slate-800">{heatmapData.length}</span>
            </p>
            <div className="space-y-2 max-h-[440px] overflow-auto pr-1">
              {heatmapData.slice(0, 30).map((item) => (
                <div key={item._id} className="border border-slate-200 rounded-lg px-3 py-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-800">{item.category}</span>
                    <span className="text-slate-500">{item.status}</span>
                  </div>
                  <p className="text-slate-500 mt-1">
                    {Array.isArray(item.location?.coordinates)
                      ? `${item.location.coordinates[0]}, ${item.location.coordinates[1]}`
                      : "No coordinates"}
                  </p>
                </div>
              ))}
              {!heatmapData.length && !loading && (
                <p className="text-sm text-slate-500">No heatmap points available.</p>
              )}
            </div>
          </div>
        </section>

        {message && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            {message}
          </div>
        )}
        {error && (
          <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
            {error}
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {icon}
    </div>
    <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
  </div>
);

export default GovernorDashboard;
