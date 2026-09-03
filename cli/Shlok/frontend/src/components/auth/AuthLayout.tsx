import React from "react";
import { PromoPanel } from "./PromoPanel";
import type { PromoPanelProps } from "./PromoPanel";
import { Logo } from "../ui/Logo";
import { authBranding } from "../../config/branding";

export interface AuthLayoutProps {
  children: React.ReactNode;
  showPromo?: boolean;
  promo?: PromoPanelProps;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  showPromo = false,
  promo,
}) => {
  const isSplitScreen = (showPromo && authBranding.showPromoPanel) || Boolean(promo);

  if (!isSplitScreen) {
    return (
      <div className="min-h-screen w-full bg-[#FAFAFA] text-[#111111] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans antialiased">
        <div className="w-full max-w-[440px] pt-4 sm:pt-6 flex justify-center">
          <Logo showText={true} size={32} />
        </div>

        <div className="w-full max-w-[440px] bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 md:p-10 shadow-xs my-auto">
          {children}
        </div>

        <div className="text-[12px] text-[#9CA3AF] font-medium py-4 text-center">
          © {new Date().getFullYear()} Auth Module
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white text-[#111111] flex flex-col md:flex-row font-sans antialiased">
      {/* Left Branding Panel (Hidden on mobile <768px, ~42% width on desktop) */}
      <div className="hidden md:block w-[42%] lg:w-[44%] xl:w-[42%] border-r border-[#E5E7EB] min-h-screen shrink-0">
        <PromoPanel {...promo} />
      </div>

      {/* Right Auth Form Panel (~58% width on desktop) */}
      <div className="flex-1 min-h-screen flex flex-col justify-between bg-white px-5 py-8 sm:px-10 sm:py-12 md:px-12 lg:px-16 overflow-y-auto">
        {/* Mobile Header (Only on screens <768px) */}
        <div className="md:hidden flex items-center justify-between pb-6 mb-4 border-b border-[#E5E7EB] w-full max-w-[440px] mx-auto">
          <Logo showText={true} size={30} />
        </div>

        {/* Centered Form Wrapper */}
        <div className="w-full max-w-[440px] mx-auto my-auto py-4">
          {children}
        </div>

        {/* Mobile Minimal Footer */}
        <div className="md:hidden text-[12px] text-[#9CA3AF] font-medium pt-8 text-center w-full max-w-[440px] mx-auto">
          © {new Date().getFullYear()} Auth Module
        </div>
      </div>
    </div>
  );
};
