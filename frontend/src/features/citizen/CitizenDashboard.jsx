import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createReport, getMyReports } from "../../services/reportService";

const reportSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(8, "Description is required"),
  urgency: z.enum(["Low", "Medium", "High"]),
  photoBefore: z
    .any()
    .refine((f) => f?.length === 1, "Photo is required"),
  addressDescription: z.string().optional(),
});

const CitizenDashboard = () => {
  const [reports, setReports] = useState([]);
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

      const fileName = values.photoBefore?.[0]?.name || "report-photo.jpg";
      const photoPath = `/uploads/before/${fileName}`;

      const payload = {
        category: values.category,
        description: values.description,
        urgency: values.urgency,
        addressDescription: values.addressDescription || "",
        photoBefore: photoPath,
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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Citizen Dashboard</h1>
            <p className="text-sm text-slate-500">{user?.fullName || "Urban Fix Citizen"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid lg:grid-cols-2 gap-6">
        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Report</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                {...register("category")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Roads">Roads</option>
                <option value="Electricity">Electricity</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Pothole">Pothole</option>
                <option value="Streetlight">Streetlight</option>
                <option value="Leak">Leak</option>
                <option value="Trash">Trash</option>
                <option value="Sewage">Sewage</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-rose-600">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              {errors.description && (
                <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Urgency</label>
              <select
                {...register("urgency")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <input
                {...register("addressDescription")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Photo Before</label>
              <input
                type="file"
                accept="image/*"
                {...register("photoBefore")}
                className="w-full text-sm"
              />
              {errors.photoBefore && (
                <p className="mt-1 text-xs text-rose-600">{errors.photoBefore.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={getLocation}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
            >
              Use My Current Location
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-slate-900 text-white px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>

          {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
          {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">My Reports</h2>
          {loadingReports ? (
            <p className="text-sm text-slate-500">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-500">No reports yet.</p>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
              {reports.map((report) => (
                <article
                  key={report._id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">{report.category}</p>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{report.description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Urgency: {report.urgency} | Created:{" "}
                    {new Date(report.createdAt).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CitizenDashboard;
