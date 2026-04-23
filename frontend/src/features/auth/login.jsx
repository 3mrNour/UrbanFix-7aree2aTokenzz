import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { loginUser, registerUser } from "../../services/authService";

const loginSchema = z.object({
  identifier: z.string().min(3, "Identifier is required"),
  password: z.string().min(6, "Password is required"),
  mode: z.enum(["user", "admin"]),
});

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    role: z.enum(["CITIZEN", "TECHNICIAN", "MANAGER", "GOVERNOR"]),
    nationalId: z.string().optional(),
    employeeId: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    phoneNumber: z.string().min(7, "Phone number is required"),
  })
  .superRefine((values, ctx) => {
    if (values.role === "CITIZEN" && !values.nationalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nationalId"],
        message: "National ID is required for CITIZEN",
      });
    }

    if (values.role !== "CITIZEN" && !values.employeeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employeeId"],
        message: "Employee ID is required for staff roles",
      });
    }
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
  const [infoMessage, setInfoMessage] = useState("");
  const [authMode, setAuthMode] = useState("login");

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      mode: "user",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      role: "CITIZEN",
      nationalId: "",
      employeeId: "",
      password: "",
      phoneNumber: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = loginForm;

  const mode = watch("mode");
  const registerRole = registerForm.watch("role");
  const isLogin = useMemo(() => authMode === "login", [authMode]);

  const saveSession = (data) => {
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
  };

  const onLoginSubmit = async (values) => {
    try {
      setServerError("");
      setInfoMessage("");
      const payload = buildPayload(values.identifier, values.password, values.mode);
      const data = await loginUser(payload, values.mode);
      saveSession(data);
    } catch (error) {
      setServerError(error?.response?.data?.message || "Login failed. Please try again.");
    }
  };

  const onRegisterSubmit = async (values) => {
    try {
      setServerError("");
      setInfoMessage("");
      const payload = {
        fullName: values.fullName,
        role: values.role,
        nationalId: values.role === "CITIZEN" ? values.nationalId : undefined,
        employeeId: values.role !== "CITIZEN" ? values.employeeId : undefined,
        password: values.password,
        phoneNumber: values.phoneNumber,
      };

      await registerUser(payload);

      if (values.role === "CITIZEN") {
        // Auto-login citizens so they can immediately use reporting features.
        const data = await loginUser(
          { nationalId: values.nationalId, password: values.password },
          "user"
        );
        saveSession(data);
        return;
      }

      setAuthMode("login");
      setInfoMessage("Account created successfully. Please login after activation.");
    } catch (error) {
      setServerError(error?.response?.data?.message || "Register failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid lg:grid-cols-[1.05fr,1fr]">
        <aside className="relative hidden lg:flex min-h-[640px] p-8 text-white bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.28),transparent_36%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.2),transparent_34%),radial-gradient(circle_at_50%_82%,rgba(255,255,255,0.18),transparent_36%)]" />
          <div className="relative z-10 flex flex-col justify-between w-full">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/80 font-semibold">Urban Fix</p>
              <h2 className="mt-6 text-3xl font-bold leading-tight">
                Build a cleaner city, one report at a time
              </h2>
              <p className="mt-4 text-sm text-white/85 max-w-xs">
                Report issues fast, dispatch teams smarter, and track every fix from start to finish.
              </p>
            </div>
            <div className="text-xs text-white/85">
              <p>Connected workflow for citizens, dispatchers, technicians, and governors across Urban Fix.</p>
            </div>
          </div>
        </aside>

        <section className="p-6 sm:p-10 md:p-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Get Started Now</h1>
            <p className="text-sm text-slate-500 mt-1">
              {isLogin ? "Login to continue to your dashboard" : "Create account and start reporting"}
            </p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setServerError("");
                setInfoMessage("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                isLogin
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-transparent text-slate-700 hover:bg-white/60"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setServerError("");
                setInfoMessage("");
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                !isLogin
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-transparent text-slate-700 hover:bg-white/60"
              }`}
            >
              Register
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Login Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="cursor-pointer">
                  <input type="radio" value="user" className="sr-only peer" {...register("mode")} />
                  <div className="w-full text-center px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition">
                    User Login
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="radio" value="admin" className="sr-only peer" {...register("mode")} />
                  <div className="w-full text-center px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 transition">
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
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
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
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
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
            {infoMessage && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {mode === "admin" ? <ShieldCheck size={16} /> : <LogIn size={16} />}
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                {...registerForm.register("fullName")}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              {registerForm.formState.errors.fullName && (
                <p className="text-xs text-rose-600 mt-1">
                  {registerForm.formState.errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
              <select
                {...registerForm.register("role")}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="CITIZEN">CITIZEN</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
                <option value="MANAGER">MANAGER</option>
                <option value="GOVERNOR">GOVERNOR</option>
              </select>
            </div>

            {registerRole === "CITIZEN" ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">National ID</label>
                <input
                  {...registerForm.register("nationalId")}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                {registerForm.formState.errors.nationalId && (
                  <p className="text-xs text-rose-600 mt-1">
                    {registerForm.formState.errors.nationalId.message}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employee ID</label>
                <input
                  {...registerForm.register("employeeId")}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
                {registerForm.formState.errors.employeeId && (
                  <p className="text-xs text-rose-600 mt-1">
                    {registerForm.formState.errors.employeeId.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                {...registerForm.register("phoneNumber")}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              {registerForm.formState.errors.phoneNumber && (
                <p className="text-xs text-rose-600 mt-1">
                  {registerForm.formState.errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                {...registerForm.register("password")}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              {registerForm.formState.errors.password && (
                <p className="text-xs text-rose-600 mt-1">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3">
                {serverError}
              </div>
            )}
            {infoMessage && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={registerForm.formState.isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white py-2.5 text-sm font-medium hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              <UserPlus size={16} />
              {registerForm.formState.isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>
        )}
        </section>
      </div>
    </div>
  );
};

export default Login;