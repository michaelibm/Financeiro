"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-4 duration-300"
      style={{
        background: type === "success" ? "#0f2a1a" : "#2a0f0f",
        borderColor: type === "success" ? "#166534" : "#991b1b",
      }}
    >
      {type === "success"
        ? <CheckCircle size={18} className="text-emerald-400 shrink-0" />
        : <XCircle size={18} className="text-red-400 shrink-0" />}
      <span className="text-sm text-white">{message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
