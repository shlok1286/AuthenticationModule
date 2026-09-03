import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setPendingEmail } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      setPendingEmail(res.data.email || email);
      navigate("/reset-password");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to process forgot password request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout showPromo={true}>
      <div className="flex flex-col w-full text-left">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#111111] leading-tight">
            Reset your password
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1.5">
            Enter your email address to receive a password reset code.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-[13px] font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[48px] mt-1 bg-[#111111] hover:bg-[#262626] active:bg-black text-white font-semibold text-[14px] rounded-[8px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center cursor-pointer"
          >
            {isSubmitting ? "Sending code..." : "Send reset code"}
          </button>
        </form>

        <p className="text-[14px] text-[#6B7280] text-center mt-6">
          <Link
            to="/login"
            className="font-medium text-[#6B7280] hover:text-[#111111] hover:underline underline-offset-4"
          >
            ← Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};
