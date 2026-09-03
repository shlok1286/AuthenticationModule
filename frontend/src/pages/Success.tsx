import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/auth/AuthLayout";
import { useAuth } from "../context/AuthContext";
import { Check } from "lucide-react";

export const Success: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
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
    navigate("/login", { replace: true });
  };

  return (
    <AuthLayout showPromo={true}>
      <div className="flex w-full flex-col items-center justify-center py-2 text-center">
        <div
          aria-hidden="true"
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"
        >
          <Check size={29} strokeWidth={2.4} />
        </div>

        <div className="mb-7">
          <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#111111]">
            Successfully Logged In
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-1.5 max-w-xs mx-auto">
            You have successfully logged in to your account.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            // Intentionally left as a no-op until the parent application supplies its destination.
            className="w-full h-[48px] bg-[#111111] hover:bg-[#262626] active:bg-black text-white font-semibold text-[14px] rounded-[8px] transition-colors duration-150 shadow-xs flex items-center justify-center cursor-pointer"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full h-[48px] bg-white hover:bg-[#F9FAFB] active:bg-[#F3F4F6] border border-[#E5E7EB] hover:border-[#D1D5DB] text-[#374151] font-semibold text-[14px] rounded-[8px] transition-colors duration-150 flex items-center justify-center cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
