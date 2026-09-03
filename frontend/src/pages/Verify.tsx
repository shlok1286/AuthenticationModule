import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { OTPInput } from "../components/ui/otp-input";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

const maskEmail = (email: string): string => {
  if (!email || !email.includes("@")) return "your registered email";
  const [local, domain] = email.split("@");
  if (local.length <= 2) return `${local.slice(0, 1)}••••@${domain}`;
  return `${local.slice(0, 1)}•••••${local.slice(-1)}@${domain}`;
};

export const Verify: React.FC = () => {
  const { pendingEmail, fetchUser, user } = useAuth();
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [readyForSuccess, setReadyForSuccess] = useState(false);

  const [resendTimer, setResendTimer] = useState<number>(45);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [resendMessage, setResendMessage] = useState<string>("");

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (readyForSuccess && user) {
      navigate("/success", { replace: true });
    }
  }, [navigate, readyForSuccess, user]);

  const handleVerify = async (codeToVerify?: string) => {
    const finalOtp = codeToVerify || otp;
    setError("");

    if (finalOtp.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setIsVerifying(true);
    try {
      await api.post("/api/auth/verify-otp", {
        email: pendingEmail,
        otp: finalOtp,
      });

      const authenticatedUser = await fetchUser();
      if (!authenticatedUser) {
        throw new Error("Your session could not be confirmed. Please sign in again.");
      }

      setSuccess(true);
      setReadyForSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Invalid or expired verification code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setError("");
    setResendMessage("");

    try {
      await api.post("/api/auth/resend-otp", { email: pendingEmail });
      setResendMessage("A new 6-digit code has been sent to your email.");
      setCanResend(false);
      setResendTimer(45);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend code.");
    }
  };

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AuthLayout showPromo={true}>
      <div className="flex flex-col w-full text-center">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight text-[#111111] leading-tight">
            Verify your email
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1.5 leading-relaxed">
            We've sent a 6-digit verification code to
            <br />
            <span className="font-semibold text-[#111111]">
              {pendingEmail ? maskEmail(pendingEmail) : "your registered email"}
            </span>
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-[8px] bg-red-50 border border-red-200 text-[13px] font-medium text-red-700 text-center">
            {error}
          </div>
        )}

        {/* Resend Success Banner */}
        {resendMessage && (
          <div className="mb-5 p-3.5 rounded-[8px] bg-emerald-50 border border-emerald-200 text-[13px] font-medium text-emerald-800 text-center">
            {resendMessage}
          </div>
        )}

        {/* OTP Input Component */}
        <div className="py-3">
          <OTPInput
            length={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (error) setError("");
            }}
            onComplete={(val) => {
              setOtp(val);
              handleVerify(val);
            }}
            isError={Boolean(error)}
            isSuccess={success}
            isDisabled={isVerifying}
            autoFocus={true}
          />
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isVerifying || otp.length !== 6}
          className="w-full h-[48px] mt-4 bg-[#111111] hover:bg-[#262626] active:bg-black text-white font-semibold text-[14px] rounded-[8px] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs flex items-center justify-center cursor-pointer"
        >
          {isVerifying ? "Verifying..." : "Verify code"}
        </button>

        {/* Resend Footer */}
        <div className="flex flex-col items-center gap-1.5 text-[13px] text-[#6B7280] pt-6">
          <p>Didn't receive the code?</p>
          {canResend ? (
            <button
              type="button"
              onClick={handleResendCode}
              className="font-semibold text-[#111111] hover:underline underline-offset-4 cursor-pointer"
            >
              Resend code
            </button>
          ) : (
            <span className="font-mono text-[#9CA3AF] text-[12px]">
              Resend available in {formatTimer(resendTimer)}
            </span>
          )}
        </div>

        {/* Back to sign in link */}
        <p className="text-[13px] text-[#6B7280] text-center mt-6">
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
