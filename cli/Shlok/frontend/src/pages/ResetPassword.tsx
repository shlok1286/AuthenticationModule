import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { AuthInput } from "../components/auth/AuthInput";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

export const ResetPassword: React.FC = () => {
  const { pendingEmail } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(pendingEmail || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !otp || !newPassword) {
      setError("Please complete all required fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/auth/reset-password", {
        email,
        otp,
        newPassword,
        confirmPassword,
      });

      navigate("/login?message=Password+reset+successful.+Please+sign+in.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. Please verify the code.");
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
            Set new password
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1.5">
            Enter the 6-digit code sent to your email and your new password.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-[13px] font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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
            label="6-Digit Reset Code"
            type="text"
            placeholder="123456"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <AuthInput
            label="New password"
            type="password"
            placeholder="At least 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <AuthInput
            label="Confirm password"
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-[48px] mt-2 bg-[#111111] hover:bg-[#262626] active:bg-black text-white font-semibold text-[14px] rounded-[8px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center cursor-pointer"
          >
            {isSubmitting ? "Resetting password..." : "Reset password"}
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
