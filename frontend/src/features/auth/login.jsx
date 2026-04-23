import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LogIn, ShieldCheck } from "lucide-react";
import api from "../../services/api";

const loginSchema = z.object({
  identifier: z.string().min(3, "Identifier is required"),
  password: z.string().min(6, "Password is required"),
  mode: z.enum(["user", "admin"]),
});

const roleRedirectMap = {
  CITIZEN: "/citizen/dashboard",
  TECHNICIAN: "/technician/dashboard",
  MANAGER: "/manager/dashboard",
  GOVERNOR: "/governor/dashboard",
};

const buildPayload = (identifier, password, mode) => {
  if (mode === "admin") {
    return { employeeId: identifier.trim(), password };
  }

  const normalized = identifier.trim();
  const looksLikeEmployee = /[A-Za-z]/.test(normalized) || normalized.includes("-");

  if (looksLikeEmployee) {
    return { employeeId: normalized, password };
  }

  return { nationalId: normalized, password };
};

const Login = () => {
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      mode: "user",
    },
  });

  const mode = watch("mode");

  const onSubmit = async (values) => {
    try {
      setServerError("");

      const endpoint = values.mode === "admin" ? "/users/admin/login" : "/users/login";
      const payload = buildPayload(values.identifier, values.password, values.mode);
      const { data } = await api.post(endpoint, payload);

      const token = data?.token || data?.accessToken;
      const user = data?.data || {};
      const role = user?.role;

      if (!token) {
        throw new Error("Token not found in response");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (role) localStorage.setItem("role", role);

      const targetPath = roleRedirectMap[role] || "/dashboard";
      window.location.assign(targetPath);
    } catch (error) {
      setServerError(error?.response?.data?.message || "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">Urban Fix</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Login Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="cursor-pointer">
                <input type="radio" value="user" className="sr-only peer" {...register("mode")} />
                <div className="w-full text-center px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 peer-checked:bg-slate-900 peer-checked:text-white peer-checked:border-slate-900 transition">
                  User Login
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" value="admin" className="sr-only peer" {...register("mode")} />
                <div className="w-full text-center px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 peer-checked:bg-slate-900 peer-checked:text-white peer-checked:border-slate-900 transition">
                  Admin Login
                </div>
              </label>
            </div>
            {errors.mode && <p className="text-xs text-rose-600 mt-1">{errors.mode.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {mode === "admin" ? "Employee ID" : "National ID or Employee ID"}
            </label>
            <input
              {...register("identifier")}
              placeholder={mode === "admin" ? "ADMIN-0001" : "29801011234567 or TECH-2201"}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            {errors.identifier && (
              <p className="text-xs text-rose-600 mt-1">{errors.identifier.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <input
              type="password"
              {...register("password")}
              placeholder="Enter your password"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            {errors.password && (
              <p className="text-xs text-rose-600 mt-1">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white py-2.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            {mode === "admin" ? <ShieldCheck size={16} /> : <LogIn size={16} />}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;