import React, { useState } from "react";
import { User, Key, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../lib/axios";
import { isAxiosError } from "axios";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [errors, setErrors] = useState({ loginId: "", password: "" });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { loginId: "", password: "" };

    if (!formData.loginId.trim()) {
      newErrors.loginId = "Login ID is required";
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      const response = await api.post("/users/login", formData);

      setUser(response.data.data.user);

      toast.success("Welcome back to REBOO ERP!");
      navigate("/dashboard");
    } catch (error: unknown) {
      console.error("Login Error:", error);

      let errorMessage =
        "Login failed. Please check your credentials and try again.";

      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrors({ ...errors, [e.target.name]: "" });
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-225 bg-card rounded-2xl shadow-modal flex flex-col md:flex-row overflow-hidden z-10 animate-fade-in relative">
        {/* Left Side: Brand Panel */}
        <div className="hidden md:flex md:w-5/12 bg-primary p-10 flex-col justify-between relative overflow-hidden text-white">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Key size={300} />
          </div>

          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              REBOOT-AI ERP
            </h1>
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">
              Premium Management
            </span>
          </div>

          <div className="relative z-10 mt-20">
            <h2 className="text-2xl font-semibold leading-snug mb-4">
              Welcome back to
              <br />
              Siddharaj Hotel & Resort
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Sign in to manage room allocations, oversee staff operations, and
              access premium analytics.
            </p>
          </div>

          <div className="relative z-10 text-xs text-white/60 font-medium">
            &copy; {new Date().getFullYear()}{" "}
            <a
              href="https://rebootai.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors underline-offset-2 hover:underline"
            >
              RebootAi
            </a>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-card">
          <div className="md:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              REBOO ERP
            </h1>
            <span className="text-[10px] font-bold tracking-widest uppercase text-primary">
              Premium Management
            </span>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-text-primary">Sign In</h3>
            <p className="text-sm text-text-secondary mt-2">
              Enter your credentials to access the portal.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Login ID Field */}
            <div>
              <label className="input-label text-[10px] font-bold uppercase tracking-wider mb-2">
                Login ID
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="loginId"
                  value={formData.loginId}
                  onChange={handleChange}
                  placeholder="e.g. admin_01"
                  className={`input-field pl-11 py-3.5 ${errors.loginId ? "border-danger focus:border-danger focus:ring-danger" : ""}`}
                />
              </div>
              {errors.loginId && (
                <p className="text-xs text-danger mt-1.5 font-medium">
                  {errors.loginId}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label text-[10px] font-bold uppercase tracking-wider mb-0">
                  Password
                </label>
                <a
                  href="#"
                  className="text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
                  <Key size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input-field pl-11 pr-11 py-3.5 ${errors.password ? "border-danger focus:border-danger focus:ring-danger" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-danger mt-1.5 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3.5 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
