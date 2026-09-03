import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setPendingEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const queryError = searchParams.get("error");
  const queryMessage = searchParams.get("message");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      setPendingEmail(res.data.email || email);
      navigate("/verify");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <AuthLayout showPromo={true}>
      <div className="flex flex-col w-full text-left">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#111111] leading-tight">
            Welcome back
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1.5">
            Sign in to continue to your account.
          </p>
        </div>

        {/* Global Success / Info Banner from Query */}
        {queryMessage && !error && (
          <div className="mb-5 p-3.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-[13px] font-medium text-emerald-800">
            {queryMessage}
          </div>
        )}

        {/* Global Error Banner */}
        {(error || queryError) && (
          <div className="mb-5 p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-[13px] font-medium text-red-700">
            {error || queryError}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput
            label="Email address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <AuthInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {/* Controls Row */}
          <div className="flex items-center justify-between pt-0.5 pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-[13px] text-[#4B5563]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-[4px] border-[#D1D5DB] text-[#111111] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#111111]"
              />
              Remember me
            </label>

            <Link
              to="/forgot-password"
              className="text-[13px] font-medium text-[#4B5563] hover:text-[#111111] hover:underline underline-offset-4 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[48px] mt-1 bg-[#111111] hover:bg-[#262626] active:bg-black text-white font-semibold text-[14px] rounded-[8px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center cursor-pointer"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB]" />
          </div>
          <div className="relative flex justify-center text-[12px] uppercase">
            <span className="bg-white px-3 text-[#9CA3AF] font-medium tracking-wider select-none">
              OR
            </span>
          </div>
        </div>

        {/* Google Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleAuth}
          className="w-full h-[48px] bg-white hover:bg-[#F9FAFB] active:bg-[#F3F4F6] border border-[#E5E7EB] hover:border-[#D1D5DB] text-[#111111] font-semibold text-[14px] rounded-[8px] transition-colors duration-150 flex items-center justify-center gap-3 shadow-2xs cursor-pointer select-none"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Bottom Signup Link */}
        <p className="text-[14px] text-[#6B7280] text-center mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-[#111111] hover:underline underline-offset-4"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
