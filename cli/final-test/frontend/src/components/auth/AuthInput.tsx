import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  helperText,
  type = "text",
  id,
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === "password";
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const actualType = isPasswordType ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      <label
        htmlFor={inputId}
        className="text-[13px] font-semibold text-[#111111]"
      >
        {label}
      </label>

      <div className="relative w-full">
        <input
          id={inputId}
          type={actualType}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full h-[48px] px-3.5 bg-white border rounded-[8px] text-[14px] text-[#111111] placeholder:text-[#9CA3AF] outline-none transition-colors duration-150 ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10"
              : "border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]"
          } ${isPasswordType ? "pr-11" : ""} ${className}`}
          {...props}
        />

        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111111] focus:outline-none p-1.5 rounded-[6px] transition-colors"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>

      {error ? (
        <span id={`${inputId}-error`} className="text-[12px] font-medium text-red-600 mt-0.5">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${inputId}-helper`} className="text-[12px] text-[#6B7280] mt-0.5">
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
