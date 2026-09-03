import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, User, Mail, Shield } from "lucide-react";

export const Success: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center text-[14px] font-medium text-[#6B7280]">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleContinue = () => {
    alert("Authentication complete. You can now redirect users to your dashboard or application.");
  };

  return (
    <AuthLayout showPromo={true}>
      <div className="flex flex-col items-center justify-center text-center w-full py-2">
        {/* Success Emblem */}
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-5 shadow-2xs">
          <CheckCircle2 size={28} strokeWidth={2.2} />
        </div>

        {/* Text Details */}
        <div className="mb-6">
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#111111]">
            Successfully authenticated
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1.5 max-w-xs mx-auto">
            You are now securely signed in to your account.
          </p>
        </div>

        {/* User Card */}
        <div className="w-full bg-[#FAFAFA] border border-[#E5E7EB] rounded-[10px] p-4 text-left mb-6 space-y-2.5">
          {user.name && (
            <div className="flex items-center gap-2.5 text-[13px] text-[#374151]">
              <User size={15} className="text-[#9CA3AF] shrink-0" />
              <span className="font-semibold text-[#111111]">{user.name}</span>
            </div>
          )}

          {user.email && (
            <div className="flex items-center gap-2.5 text-[13px] text-[#374151]">
              <Mail size={15} className="text-[#9CA3AF] shrink-0" />
              <span className="text-[#4B5563]">{user.email}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 text-[12px] text-[#059669] pt-1 border-t border-[#E5E7EB]">
            <Shield size={14} className="text-[#059669] shrink-0" />
            <span className="font-medium">Active secure session</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full h-[48px] bg-[#111111] hover:bg-[#262626] active:bg-black text-white font-semibold text-[14px] rounded-[8px] transition-colors duration-150 shadow-xs flex items-center justify-center cursor-pointer"
          >
            Continue to dashboard
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-[48px] bg-white hover:bg-[#F9FAFB] active:bg-[#F3F4F6] border border-[#E5E7EB] hover:border-[#D1D5DB] text-[#374151] font-semibold text-[14px] rounded-[8px] transition-colors duration-150 flex items-center justify-center cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
