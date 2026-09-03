import React from "react";
import { authBranding } from "../../config/branding";

export interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  showText = true,
  size = 32,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Minimal Monochrome SaaS Emblem */}
      <div
        style={{ width: size, height: size }}
        className="rounded-[8px] bg-[#111111] text-white flex items-center justify-center shrink-0 shadow-xs select-none"
      >
        <svg
          width={Math.round(size * 0.56)}
          height={Math.round(size * 0.56)}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Geometric Keyhole / Shield Monogram */}
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      {showText && (
        <span className="font-semibold text-[15px] tracking-tight text-[#111111] select-none">
          {authBranding.logoText}
        </span>
      )}
    </div>
  );
};
