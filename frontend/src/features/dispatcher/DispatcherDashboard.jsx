import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, ClipboardCheck, LogOut, Search, Send, UserRoundCheck } from "lucide-react";
import {
  assignTask,
  delegateTasks,
  getAvailableTechnicians,
  getPendingReports,
  reviewReport,
} from "../../services/dispatcherService";

const DispatcherDashboard = () => {
  const [reports, setReports] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewAction, setReviewAction] = useState("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [activeTab, setActiveTab] = useState("reports");
  const [fromTechnicianId, setFromTechnicianId] = useState("");
  const [toTechnicianId, setToTechnicianId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getPendingReports();
      setReports(response?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load pending reports");
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      setError("");
      const response = await getAvailableTechnicians();
      const list = response?.data || [];
      setTechnicians(list);

      if (!selectedTechnician && list.length) {
        setSelectedTechnician(list[0]._id);
      }
      if (!fromTechnicianId && list.length) {
        setFromTechnicianId(list[0]._id);
      }
      if (!toTechnicianId && list.length > 1) {
        setToTechnicianId(list[1]._id);
      } else if (!toTechnicianId && list.length === 1) {
        setToTechnicianId(list[0]._id);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load technicians");
    }
  };

  useEffect(() => {
    loadReports();
    loadTechnicians();
  }, []);

  const openReport = (report) => {
    setSelectedReport(report);
    setReviewAction("APPROVE");
    setRejectionReason("");
    if (technicians.length) {
      setSelectedTechnician(technicians[0]._id);
    }
  };

  const handleReview = async () => {
    if (!selectedReport?._id) return;

    try {
      setMessage("");
      setError("");
      const payload =
        reviewAction === "REJECT"
          ? { action: "REJECT", rejectionReason: rejectionReason.trim() }
          : { action: "APPROVE" };

      await reviewReport(selectedReport._id, payload);
      setMessage("Report reviewed successfully");
      setSelectedReport(null);
      await loadReports();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to review report");
    }
  };

  const handleAssign = async () => {
    if (!selectedReport?._id || !selectedTechnician) return;

    try {
      setMessage("");
      setError("");
      await assignTask(selectedReport._id, selectedTechnician);
      setMessage("Task assigned successfully");
      setSelectedReport(null);
      await loadReports();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to assign report");
    }
  };

  const handleDelegate = async () => {
    if (!fromTechnicianId || !toTechnicianId) return;

    try {
      setMessage("");
      setError("");
      const response = await delegateTasks({ fromTechnicianId, toTechnicianId });
      const modifiedCount = response?.data?.modifiedCount ?? 0;
      setMessage(`Delegation completed. ${modifiedCount} task(s) moved.`);
      await loadTechnicians();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to delegate tasks");
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
      <aside className="w-72 bg-slate-900 text-slate-300 flex-shrink-0 flex-col hidden lg:flex h-full shadow-2xl z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Urban Fix</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-0.5">
                Dispatcher Panel
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <button
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "reports"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Search className="w-5 h-5" />
            District Reports
          </button>
          <button
            onClick={() => setActiveTab("dispatch")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "dispatch"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <UserRoundCheck className="w-5 h-5" />
            Review & Assign
          </button>
          <button
            onClick={() => setActiveTab("delegate")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "delegate"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <ArrowRightLeft className="w-5 h-5" />
            Delegation Mode
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/40 rounded-xl p-4 mb-4 border border-slate-700/50">
            <p className="text-sm font-bold text-white line-clamp-1">{user?.fullName || "Dispatcher"}</p>
            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              {user?.role || "MANAGER"}
            </p>
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === "reports" && "Pending Reports"}
            {activeTab === "dispatch" && "Report Review & Assignment"}
            {activeTab === "delegate" && "Technician Delegation Mode"}
          </h2>
          <button
            onClick={loadReports}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Search className="w-4 h-4" />
            Refresh
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-5">
          {message && (
            <div className="text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              {message}
            </div>
          )}
          {error && (
            <div className="text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-4">
              {error}
            </div>
          )}

          {activeTab === "reports" && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600 font-medium">
                  Only reports with status <span className="font-bold">PENDING</span> are shown.
                </p>
                <button
                  onClick={loadReports}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-bold px-4 py-2.5 hover:bg-indigo-700"
                >
                  <Search className="w-4 h-4" /> Reload Pending
                </button>
              </div>

              <div className="overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Urgency</th>
                      <th className="py-3 px-4">Citizen</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">{report.category}</td>
                        <td className="py-3 px-4">{report.status}</td>
                        <td className="py-3 px-4">{report.urgency}</td>
                        <td className="py-3 px-4">{report.citizen?.fullName || "-"}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setActiveTab("dispatch");
                              openReport(report);
                            }}
                            className="rounded-lg bg-indigo-600 text-white text-xs font-bold px-3 py-2 hover:bg-indigo-700"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!reports.length && !loading && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-500">
                          No pending reports found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "dispatch" && (
            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Triage Report</h3>
                {!selectedReport ? (
                  <p className="text-sm text-slate-500">Select a report from "District Reports".</p>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm space-y-2">
                      <p><span className="font-semibold">Category:</span> {selectedReport.category}</p>
                      <p><span className="font-semibold">Status:</span> {selectedReport.status}</p>
                      <p><span className="font-semibold">Urgency:</span> {selectedReport.urgency}</p>
                      <p><span className="font-semibold">Citizen:</span> {selectedReport.citizen?.fullName || "-"}</p>
                      <p><span className="font-semibold">Description:</span> {selectedReport.description || "-"}</p>
                    </div>

                    <select
                      value={reviewAction}
                      onChange={(e) => setReviewAction(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="APPROVE">APPROVE</option>
                      <option value="REJECT">REJECT</option>
                    </select>
                    {reviewAction === "REJECT" && (
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        placeholder="Rejection reason (required)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    )}
                    <button
                      onClick={handleReview}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-bold px-4 py-3 hover:bg-indigo-700"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Save Review
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Assign Technician</h3>
                {!selectedReport ? (
                  <p className="text-sm text-slate-500">Select a report first.</p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      Technicians are sorted by active task count (least busy first).
                    </p>
                    <select
                      value={selectedTechnician}
                      onChange={(e) => setSelectedTechnician(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select Technician</option>
                      {technicians.map((tech) => (
                        <option key={tech._id} value={tech._id}>
                          {tech.fullName} | active tasks: {tech.activeTaskCount}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedTechnician}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-bold px-4 py-3 hover:bg-black disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Assign Report
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "delegate" && (
            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Delegation Setup</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      From Technician
                    </label>
                    <select
                      value={fromTechnicianId}
                      onChange={(e) => setFromTechnicianId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select source technician</option>
                      {technicians.map((tech) => (
                        <option key={tech._id} value={tech._id}>
                          {tech.fullName} | active tasks: {tech.activeTaskCount}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      To Technician
                    </label>
                    <select
                      value={toTechnicianId}
                      onChange={(e) => setToTechnicianId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select destination technician</option>
                      {technicians.map((tech) => (
                        <option key={tech._id} value={tech._id}>
                          {tech.fullName} | active tasks: {tech.activeTaskCount}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleDelegate}
                    disabled={!fromTechnicianId || !toTechnicianId}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-bold px-4 py-3 hover:bg-black disabled:opacity-50"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Delegate IN_PROGRESS Tasks
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Available Technicians</h3>
                <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                  {technicians.map((tech) => (
                    <div key={tech._id} className="border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      <p className="font-semibold text-slate-800">{tech.fullName}</p>
                      <p className="text-slate-500">
                        Employee: {tech.employeeId || "-"} | Active Tasks: {tech.activeTaskCount}
                      </p>
                    </div>
                  ))}
                  {!technicians.length && (
                    <p className="text-sm text-slate-500">No available technicians found.</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default DispatcherDashboard;
