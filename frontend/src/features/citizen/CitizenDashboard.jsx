import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createReport, getMyReports } from "../../services/reportService";
import { 
  MapPin, 
  LogOut, 
  PlusCircle, 
  AlertCircle, 
  FileText, 
  LayoutList, 
  MapPinOff,
  Image as ImageIcon,
  TrafficCone,
  Lightbulb,
  Trash2,
  Droplets,
  Wrench,
  ShieldCheck,
  Siren,
  AlertTriangle
} from "lucide-react";

const reportSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(8, "Description is required"),
  urgency: z.enum(["Low", "Medium", "High"]),
  photoBefore: z
    .any()
    .refine((f) => f?.length === 1, "Photo is required"),
  addressDescription: z.string().min(3, "Address / landmark is required"),
});

const getUrgencyStyles = (urgency) => {
  switch (urgency) {
    case "High":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "Medium":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Low":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

const CATEGORY_OPTIONS = [
  { value: "Roads", label: "Roads", icon: TrafficCone },
  { value: "Electricity", label: "Electricity", icon: Lightbulb },
  { value: "Sanitation", label: "Sanitation", icon: Trash2 },
  { value: "Pothole", label: "Pothole", icon: TrafficCone },
  { value: "Streetlight", label: "Streetlight", icon: Lightbulb },
  { value: "Leak", label: "Leak", icon: Droplets },
  { value: "Trash", label: "Trash", icon: Trash2 },
  { value: "Sewage", label: "Sewage", icon: Wrench },
];

const URGENCY_OPTIONS = [
  {
    value: "Low",
    label: "Low",
    icon: ShieldCheck,
    selectedClass: "border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700",
    idleClass: "border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/40",
  },
  {
    value: "Medium",
    label: "Medium",
    icon: AlertTriangle,
    selectedClass: "border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700",
    idleClass: "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/40",
  },
  {
    value: "High",
    label: "High",
    icon: Siren,
    selectedClass: "border-rose-400 bg-gradient-to-r from-rose-50 to-red-50 text-rose-700",
    idleClass: "border-slate-200 bg-white text-slate-600 hover:border-rose-200 hover:bg-rose-50/40",
  },
];

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "VALID",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "SPAM",
  "ARCHIVED",
];

const STATUS_FLOW = ["PENDING", "VALID", "IN_PROGRESS", "RESOLVED"];

const CitizenDashboard = () => {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReport, setSelectedReport] = useState(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      category: "Roads",
      urgency: "Medium",
      description: "",
      addressDescription: "",
    },
  });

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const selectedCategory = watch("category");
  const selectedUrgency = watch("urgency");

  const filteredReports = useMemo(() => {
    if (statusFilter === "ALL") return reports;
    return reports.filter((report) => report.status === statusFilter);
  }, [reports, statusFilter]);

  const fetchMyReports = async () => {
    try {
      setLoadingReports(true);
      const response = await getMyReports();
      setReports(response?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load reports");
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  const getLocation = () => {
    setMessage("");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates([pos.coords.longitude, pos.coords.latitude]);
        setMessage("Location captured successfully");
      },
      () => {
        setError("Could not get your location");
      }
    );
  };

  const onSubmit = async (values) => {
    try {
      setSubmitting(true);
      setError("");
      setMessage("");
      const photoFile = values.photoBefore?.[0];

      const payload = {
        category: values.category,
        description: values.description,
        urgency: values.urgency,
        addressDescription: values.addressDescription || "",
        photoBefore: photoFile,
        location: {
          type: "Point",
          coordinates: coordinates || [31.2357, 30.0444],
        },
      };

      await createReport(payload);
      setMessage("Report created successfully");
      reset();
      setCoordinates(null);
      await fetchMyReports();
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to create report");
    } finally {
      setSubmitting(false);
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
      {/* Sleek Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <LayoutList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Urban Fix</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {user?.fullName || "Citizen Dashboard"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 py-8 grid lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form (Takes up 5 columns on large screens) */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <PlusCircle className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Create New Report</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
                <input type="hidden" {...register("category")} />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedCategory === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setValue("category", option.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all flex items-center gap-2 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/40"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.category && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.category.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea
                  {...register("description")}
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all resize-none"
                />
                {errors.description && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.description.message}
                  </p>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Urgency</label>
                <input type="hidden" {...register("urgency")} />
                <div className="grid grid-cols-3 gap-2">
                  {URGENCY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedUrgency === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setValue("urgency", option.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
                        }
                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          isSelected ? option.selectedClass : option.idleClass
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address / Landmark</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    {...register("addressDescription")}
                    placeholder="E.g., Near the central park gate"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                {errors.addressDescription && (
                  <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.addressDescription.message}
                  </p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Photo Evidence</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    {...register("photoBefore")}
                    className="block w-full text-sm text-slate-500 border border-slate-200 rounded-xl bg-slate-50
                      file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold 
                      file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-all cursor-pointer"
                  />
                  {errors.photoBefore && (
                    <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.photoBefore.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={getLocation}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    coordinates 
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700" 
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {coordinates ? <MapPin className="w-4 h-4" /> : <MapPinOff className="w-4 h-4" />}
                  {coordinates ? "Location Captured ✓" : "Capture Current Location"}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white px-4 py-3 text-sm font-semibold hover:bg-indigo-700 shadow-sm hover:shadow active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </span>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" /> Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Notifications */}
            {message && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                <p className="text-sm text-emerald-700 font-medium">{message}</p>
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" />
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Reports List (Takes up 7 columns on large screens) */}
        <section className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <LayoutList className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-900">My Reports</h2>
              </div>
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                    {filteredReports.length} Result
                  </span>
                </div>
            </div>

            {loadingReports ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 py-12">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-sm font-medium">Loading your reports...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 py-16 border-2 border-dashed border-slate-100 rounded-xl">
                <FileText className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No reports match this filter.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-2" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {filteredReports.map((report) => (
                  <article
                    key={report._id}
                    className="group relative rounded-xl border border-slate-200 p-5 hover:border-indigo-200 hover:shadow-md bg-white transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          <ImageIcon className="w-5 h-5 text-slate-500 group-hover:text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{report.category}</h3>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            {new Date(report.createdAt).toLocaleDateString(undefined, { 
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {report.status || "Pending"}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border font-bold ${getUrgencyStyles(report.urgency)}`}>
                          {report.urgency}
                        </span>
                      </div>
                    </div>
                    <div className="pl-12">
                      <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                        {report.description}
                      </p>
                      {report.photoBefore && (
                        <img
                          src={`http://localhost:5000${report.photoBefore}`}
                          alt="Report evidence"
                          className="mt-3 w-full max-w-sm h-40 object-cover rounded-lg border border-slate-200"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedReport(report)}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white text-xs font-bold px-3 py-2 hover:bg-black"
                      >
                        Track Problem Flow
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}

          </div>
        </section>
      </main>

      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white rounded-2xl border border-slate-200 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Problem Flow Details</h3>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {STATUS_FLOW.map((step) => {
                const currentIndex = STATUS_FLOW.indexOf(selectedReport.status);
                const stepIndex = STATUS_FLOW.indexOf(step);
                const active = currentIndex >= 0 && stepIndex <= currentIndex;
                return (
                  <span
                    key={step}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      active
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    {step}
                  </span>
                );
              })}
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Current Status: <span className="font-bold text-slate-800">{selectedReport.status}</span>
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1.5">Before Photo</p>
                {selectedReport.photoBefore ? (
                  <img
                    src={`http://localhost:5000${selectedReport.photoBefore}`}
                    alt="Before issue"
                    className="w-full h-44 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <p className="text-xs text-slate-500">No before photo.</p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 mb-1.5">Resolution Photo</p>
                {selectedReport.photoAfter ? (
                  <img
                    src={`http://localhost:5000${selectedReport.photoAfter}`}
                    alt="Resolution proof"
                    className="w-full h-44 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <p className="text-xs text-slate-500">No resolution photo uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;