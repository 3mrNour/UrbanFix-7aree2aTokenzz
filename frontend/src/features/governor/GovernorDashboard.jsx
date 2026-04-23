import { useEffect, useMemo, useState } from "react";
import { BarChart3, Users, FileWarning, LogOut, RefreshCw, Search, LayoutDashboard, Map } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("overview");

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
    <div className="flex h-screen bg-slate-50/50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-300 flex-shrink-0 flex-col hidden lg:flex h-full shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Urban Fix</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-0.5">Governor Panel</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "overview" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview & Stats
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "reports" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <FileWarning className="w-5 h-5" />
            Situation Room
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "users" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Users className="w-5 h-5" />
            Users Management
          </button>
          <button
            onClick={() => setActiveTab("heatmap")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "heatmap" 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Map className="w-5 h-5" />
            Heatmap Data
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/40 rounded-xl p-4 mb-4 border border-slate-700/50">
            <p className="text-sm font-bold text-white line-clamp-1">{user?.fullName || "City Governor"}</p>
            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{user?.role || "GOVERNOR"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-500/10 text-rose-400 text-sm font-bold hover:bg-rose-500/20 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex-shrink-0 lg:hidden">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">Urban Fix</h1>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          {/* Mobile Tabs */}
          <div className="flex overflow-x-auto border-t border-slate-100 no-scrollbar">
            {["overview", "reports", "users", "heatmap"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {/* Desktop Top Header */}
        <header className="hidden lg:flex bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm flex-shrink-0 px-8 py-5 items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800 capitalize">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "reports" && "Reports Situation Room"}
                {activeTab === "users" && "System Users Management"}
                {activeTab === "heatmap" && "Heatmap Data Preview"}
              </h2>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
              <span className="text-sm font-semibold text-slate-600">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          
          {(message || error) && (
            <div className="mb-6 space-y-3 animate-in fade-in duration-300">
              {message && (
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {message}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Reports (24h)" value={analytics?.reportsLast24Hours ?? 0} icon={<FileWarning className="w-5 h-5 text-indigo-600" />} />
                <StatCard title="Pending" value={analytics?.statusBreakdown?.PENDING ?? 0} icon={<FileWarning className="w-5 h-5 text-amber-600" />} />
                <StatCard title="In Progress" value={analytics?.statusBreakdown?.IN_PROGRESS ?? 0} icon={<RefreshCw className="w-5 h-5 text-blue-600" />} />
                <StatCard title="Resolved Avg (hrs)" value={analytics?.averageResolutionTime?.hours ?? 0} icon={<BarChart3 className="w-5 h-5 text-emerald-600" />} />
              </section>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === "reports" && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-180px)]">
              <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-indigo-600" /> Filters & Controls
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
                <select
                  value={reportFilters.status}
                  onChange={(e) => setReportFilters((p) => ({ ...p, status: e.target.value }))}
                  className="col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
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
                  placeholder="Category..."
                  value={reportFilters.category}
                  onChange={(e) => setReportFilters((p) => ({ ...p, category: e.target.value }))}
                  className="col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <select
                  value={reportFilters.urgency}
                  onChange={(e) => setReportFilters((p) => ({ ...p, urgency: e.target.value }))}
                  className="col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
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
                  className="col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <input
                  type="date"
                  value={reportFilters.toDate}
                  onChange={(e) => setReportFilters((p) => ({ ...p, toDate: e.target.value }))}
                  className="col-span-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <button
                  onClick={loadDashboard}
                  className="col-span-2 lg:col-span-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-bold px-4 py-2.5 shadow-sm hover:bg-indigo-700 hover:shadow transition-all active:scale-95"
                >
                  <Search className="w-4 h-4" /> Apply
                </button>
              </div>

              <div className="overflow-auto border border-slate-200 rounded-xl flex-1 custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Urgency</th>
                      <th className="py-3 px-4">Citizen</th>
                      <th className="py-3 px-4">Technician</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">{report.category}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                            {report.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            report.urgency === 'High' ? 'bg-rose-100 text-rose-700' : 
                            report.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' : 
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {report.urgency}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{report.citizen?.fullName || "-"}</td>
                        <td className="py-3 px-4 text-slate-600">{report.assignedTechnician?.fullName || "-"}</td>
                      </tr>
                    ))}
                    {!reports.length && !loading && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center">
                          <FileWarning className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-medium">No reports match your filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-180px)] flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" /> Account Management
                </h2>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all w-full sm:w-auto"
                >
                  <option value="">All Roles</option>
                  <option value="CITIZEN">CITIZEN</option>
                  <option value="TECHNICIAN">TECHNICIAN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="GOVERNOR">GOVERNOR</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1 content-start">
                {users.map((u) => (
                  <div key={u._id} className="border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all bg-white group">
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div>
                        <p className="font-bold text-slate-900 truncate">{u.fullName}</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{u.phoneNumber}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md border ${
                        u.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        {u.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="CITIZEN">CITIZEN</option>
                        <option value="TECHNICIAN">TECHNICIAN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="GOVERNOR">GOVERNOR</option>
                      </select>
                      <button
                        onClick={() => handleUserActivation(u._id)}
                        className={`rounded-lg text-xs font-bold px-3 py-2 transition-colors ${
                          u.isActive 
                            ? "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50" 
                            : "bg-indigo-600 border border-transparent text-white hover:bg-indigo-700"
                        }`}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                ))}
                {!users.length && !loading && (
                  <div className="col-span-full py-12 text-center">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">No users found.</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* HEATMAP TAB */}
          {activeTab === "heatmap" && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-180px)]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Map className="w-5 h-5 text-indigo-600" /> Geographic Data Preview
                </h2>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full">
                  {heatmapData.length} Map Points
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-auto pr-2 custom-scrollbar content-start flex-1">
                {heatmapData.slice(0, 50).map((item) => (
                  <div key={item._id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-800 text-sm">{item.category}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-1 bg-slate-200 text-slate-700 rounded-md">{item.status}</span>
                    </div>
                    <div className="flex items-start gap-2 mt-3 text-slate-500">
                      <Map className="w-4 h-4 mt-0.5 shrink-0 text-indigo-400" />
                      <p className="text-xs font-medium font-mono leading-relaxed">
                        {Array.isArray(item.location?.coordinates)
                          ? `Lat: ${item.location.coordinates[1]?.toFixed(4)}\nLng: ${item.location.coordinates[0]?.toFixed(4)}`
                          : "Location data unavailable"}
                      </p>
                    </div>
                  </div>
                ))}
                {!heatmapData.length && !loading && (
                  <div className="col-span-full py-12 text-center">
                    <Map className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-500">No heatmap points available.</p>
                  </div>
                )}
              </div>
            </section>
          )}

        </main>
      </div>
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
