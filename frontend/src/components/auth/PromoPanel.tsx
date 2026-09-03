import React from "react";
import { Logo } from "../ui/Logo";
import { ShieldCheck, MailCheck, Sparkles } from "lucide-react";

export interface PromoPanelProps {
  title?: string;
  description?: string;
  brandName?: string;
  logo?: React.ReactNode;
  background?: string;
  customContent?: React.ReactNode;
}

export const PromoPanel: React.FC<PromoPanelProps> = ({
  title = "Secure authentication\nfor modern applications.",
  description = "A simple and reliable authentication experience designed for secure access.",
  brandName = "Auth Module",
  logo,
  background = "bg-[#FAFAFA]",
  customContent,
}) => {
  return (
    <div
      className={`h-full flex flex-col justify-between p-8 sm:p-10 lg:p-12 xl:p-14 ${background} select-none`}
    >
      {/* Top Header / Logo */}
      <div className="flex items-center gap-3">
        {logo ? logo : <Logo showText={true} size={32} />}
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-8 flex flex-col items-start max-w-[420px]">
        {customContent ? (
          customContent
        ) : (
          <div className="space-y-8 text-left">
            {/* Headline and Description */}
            <div className="space-y-3">
              <h2 className="text-[26px] lg:text-[28px] xl:text-[30px] font-bold text-[#111111] tracking-tight leading-[1.25] whitespace-pre-line">
                {title}
              </h2>
              <p className="text-[14px] text-[#6B7280] leading-relaxed">
                {description}
              </p>
            </div>

            {/* Subtle Feature Points */}
            <div className="pt-2 space-y-3.5 border-t border-[#E5E7EB]">
              <div className="flex items-center gap-3 text-[13px] text-[#374151]">
                <div className="w-5 h-5 rounded-full bg-[#E5E7EB]/60 flex items-center justify-center text-[#111111] shrink-0">
                  <ShieldCheck size={13} strokeWidth={2.2} />
                </div>
                <span className="font-medium">Secure authentication</span>
              </div>

              <div className="flex items-center gap-3 text-[13px] text-[#374151]">
                <div className="w-5 h-5 rounded-full bg-[#E5E7EB]/60 flex items-center justify-center text-[#111111] shrink-0">
                  <MailCheck size={13} strokeWidth={2.2} />
                </div>
                <span className="font-medium">Email verification</span>
              </div>

              <div className="flex items-center gap-3 text-[13px] text-[#374151]">
                <div className="w-5 h-5 rounded-full bg-[#E5E7EB]/60 flex items-center justify-center text-[#111111] shrink-0">
                  <Sparkles size={13} strokeWidth={2.2} />
                </div>
                <span className="font-medium">Google sign-in</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean Minimal Footer */}
      <div className="text-[12px] text-[#9CA3AF] font-medium text-left">
        © {new Date().getFullYear()} {brandName}
      </div>
    </div>
  );
};
