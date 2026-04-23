import { useEffect, useMemo, useState } from "react";
import { ClipboardList, LogOut, MapPin, RefreshCw, Wrench } from "lucide-react";
import { getAssignedTasks, getTaskDetails, updateTaskStatus } from "../../services/taskService";

const ASSETS_BASE_URL = "http://localhost:5000";

const TechnicianDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [status, setStatus] = useState("IN_PROGRESS");
  const [photoAfter, setPhotoAfter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("tasks");

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAssignedTasks();
      setTasks(response?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load assigned tasks");
    } finally {
      setLoading(false);
    }
  };

  const loadTaskDetails = async (taskId) => {
    try {
      setError("");
      const response = await getTaskDetails(taskId);
      const task = response?.data || null;
      setSelectedTask(task);
      if (task?.status === "RESOLVED") {
        setStatus("RESOLVED");
      } else {
        setStatus("IN_PROGRESS");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load task details");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedTask?._id) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");
      await updateTaskStatus(selectedTask._id, { status, photoAfter });
      setMessage("Task status updated successfully");
      setPhotoAfter(null);
      await Promise.all([loadTasks(), loadTaskDetails(selectedTask._id)]);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to update task status");
    } finally {
      setSaving(false);
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
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Urban Fix</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 mt-0.5">
                Technician Panel
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "tasks"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Assigned Tasks
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${
              activeTab === "details"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <MapPin className="w-5 h-5" />
            Task Details
          </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/40 rounded-xl p-4 mb-4 border border-slate-700/50">
            <p className="text-sm font-bold text-white line-clamp-1">{user?.fullName || "Technician"}</p>
            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
              {user?.role || "TECHNICIAN"}
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
            {activeTab === "tasks" ? "Assigned Tasks" : "Task Details & Execution"}
          </h2>
          <button
            onClick={loadTasks}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </header>

        <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-2 flex gap-2">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              activeTab === "tasks" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              activeTab === "details" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Details
          </button>
        </div>

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

          {activeTab === "tasks" && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Photo</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Urgency</th>
                      <th className="py-3 px-4">Citizen</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tasks.map((task) => (
                      <tr key={task._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          {task.photoBefore ? (
                            <a href={`${ASSETS_BASE_URL}${task.photoBefore}`} target="_blank" rel="noreferrer">
                              <img
                                src={`${ASSETS_BASE_URL}${task.photoBefore}`}
                                alt="Task"
                                className="w-14 h-14 object-cover rounded-md border border-slate-200"
                              />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No photo</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">{task.category}</td>
                        <td className="py-3 px-4">
                          {task.status === "VALID" ? "PENDING_EXECUTION" : task.status}
                        </td>
                        <td className="py-3 px-4">{task.urgency}</td>
                        <td className="py-3 px-4">{task.citizen?.fullName || "-"}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              setActiveTab("details");
                              loadTaskDetails(task._id);
                            }}
                            className="rounded-lg bg-indigo-600 text-white text-xs font-bold px-3 py-2 hover:bg-indigo-700"
                          >
                            Open
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!tasks.length && !loading && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          No assigned tasks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "details" && (
            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Task Information</h3>
                {!selectedTask ? (
                  <p className="text-sm text-slate-500">Select a task from "Assigned Tasks".</p>
                ) : (
                  <div className="space-y-3 text-sm">
                    <p><span className="font-semibold">Category:</span> {selectedTask.category}</p>
                    <p><span className="font-semibold">Status:</span> {selectedTask.status}</p>
                    <p><span className="font-semibold">Urgency:</span> {selectedTask.urgency}</p>
                    <p><span className="font-semibold">Citizen:</span> {selectedTask.citizen?.fullName || "-"}</p>
                    <p><span className="font-semibold">Phone:</span> {selectedTask.citizen?.phoneNumber || "-"}</p>
                    <p><span className="font-semibold">Description:</span> {selectedTask.description || "-"}</p>
                    <p>
                      <span className="font-semibold">Coordinates:</span>{" "}
                      {Array.isArray(selectedTask.location?.coordinates)
                        ? `${selectedTask.location.coordinates[0]}, ${selectedTask.location.coordinates[1]}`
                        : "N/A"}
                    </p>
                    {selectedTask.photoBefore && (
                      <div className="pt-2">
                        <p className="font-semibold mb-1">Photo Before:</p>
                        <a href={`${ASSETS_BASE_URL}${selectedTask.photoBefore}`} target="_blank" rel="noreferrer">
                          <img
                            src={`${ASSETS_BASE_URL}${selectedTask.photoBefore}`}
                            alt="Before task"
                            className="w-full max-w-sm h-44 object-cover rounded-lg border border-slate-200"
                          />
                        </a>
                      </div>
                    )}
                    {selectedTask.photoAfter && (
                      <div className="pt-2">
                        <p className="font-semibold mb-1">Photo After:</p>
                        <a href={`${ASSETS_BASE_URL}${selectedTask.photoAfter}`} target="_blank" rel="noreferrer">
                          <img
                            src={`${ASSETS_BASE_URL}${selectedTask.photoAfter}`}
                            alt="After task"
                            className="w-full max-w-sm h-44 object-cover rounded-lg border border-slate-200"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Update Task Status</h3>
                {!selectedTask ? (
                  <p className="text-sm text-slate-500">Open a task first to update status.</p>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                      {selectedTask?.status === "VALID" && (
                        <p className="mt-2 text-xs text-slate-500">
                          First move task to <strong>IN_PROGRESS</strong>, then close it as <strong>RESOLVED</strong>.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Photo After (required when RESOLVED)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoAfter(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-slate-500 border border-slate-200 rounded-xl bg-slate-50 file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
                      />
                    </div>

                    <button
                      onClick={handleUpdateStatus}
                      disabled={saving}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white text-sm font-bold px-4 py-3 hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saving ? "Updating..." : "Save Status Update"}
                    </button>
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

export default TechnicianDashboard;
