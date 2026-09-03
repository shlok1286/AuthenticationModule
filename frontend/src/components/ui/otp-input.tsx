import React, { useRef, useState, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export interface OTPInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string) => void;
  onComplete?: (value: string) => void;
  isError?: boolean;
  isSuccess?: boolean;
  isDisabled?: boolean;
  autoFocus?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value = "",
  onChange,
  onComplete,
  isError = false,
  isSuccess = false,
  isDisabled = false,
  autoFocus = true,
}) => {
  const [digits, setDigits] = useState<string[]>(() => {
    const initial = value.split("").slice(0, length);
    return Array.from({ length }, (_, i) => initial[i] || "");
  });
  const [focusedIndex, setFocusedIndex] = useState<number>(autoFocus ? 0 : -1);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const updated = value.split("").slice(0, length);
    const newDigits = Array.from({ length }, (_, i) => updated[i] || "");
    setDigits(newDigits);
  }, [value, length]);

  const handleDigitsChange = (newDigits: string[]) => {
    setDigits(newDigits);
    const combined = newDigits.join("");
    if (onChange) onChange(combined);
    if (combined.length === length && !newDigits.includes("")) {
      if (onComplete) onComplete(combined);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const inputVal = e.target.value;
    const numericChar = inputVal.replace(/\D/g, "");

    if (!numericChar) {
      const updated = [...digits];
      updated[index] = "";
      handleDigitsChange(updated);
      return;
    }

    const charToUse = numericChar.slice(-1);
    const updated = [...digits];
    updated[index] = charToUse;
    handleDigitsChange(updated);

    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const updated = [...digits];
        updated[index - 1] = "";
        handleDigitsChange(updated);
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      } else {
        const updated = [...digits];
        updated[index] = "";
        handleDigitsChange(updated);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      inputRefs.current[0]?.focus();
      setFocusedIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      inputRefs.current[length - 1]?.focus();
      setFocusedIndex(length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pastedData) return;

    const newDigits = Array.from({ length }, (_, i) => pastedData[i] || "");
    handleDigitsChange(newDigits);

    const nextFocus = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextFocus]?.focus();
    setFocusedIndex(nextFocus);
  };

  // Subtle error animation
  const shakeVariants = {
    idle: { x: 0 },
    error: shouldReduceMotion
      ? { x: 0 }
      : {
          x: [0, -6, 6, -4, 4, -2, 2, 0],
          transition: { duration: 0.35 },
        },
  };

  return (
    <motion.div
      className="flex flex-col items-center gap-3 w-full"
      variants={shakeVariants}
      animate={isError ? "error" : "idle"}
    >
      <div className="flex items-center justify-center gap-2 sm:gap-2.5 w-full" onPaste={handlePaste}>
        {digits.map((digit, i) => {
          const isFocused = focusedIndex === i;
          const isCellFilled = Boolean(digit);

          let borderColor = "border-[#E5E7EB]";
          let bgColor = "bg-white";
          let textColor = "text-[#111111]";

          if (isError) {
            borderColor = "border-red-500 ring-1 ring-red-500";
            bgColor = "bg-red-50/10";
            textColor = "text-red-700";
          } else if (isSuccess) {
            borderColor = "border-emerald-500 ring-1 ring-emerald-500";
            bgColor = "bg-emerald-50/10";
            textColor = "text-emerald-800";
          } else if (isFocused) {
            borderColor = "border-[#111111] ring-1 ring-[#111111]";
          } else if (isCellFilled) {
            borderColor = "border-[#9CA3AF]";
          }

          return (
            <div key={i} className="relative">
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={isDisabled}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex(-1)}
                aria-label={`Digit ${i + 1} of ${length}`}
                aria-invalid={isError}
                aria-disabled={isDisabled}
                className={`w-[48px] h-[48px] sm:w-[52px] sm:h-[52px] text-center font-mono text-[20px] sm:text-[22px] font-semibold rounded-[8px] border ${borderColor} ${bgColor} ${textColor} outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs`}
              />
              <AnimatePresence>
                {isFocused && !isCellFilled && !isError && !isSuccess && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-0.5 bg-[#111111] pointer-events-none rounded-full"
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
