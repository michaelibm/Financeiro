"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) {
      window.addEventListener("keydown", handler);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className={cn(
        "relative bg-slate-900 border-slate-700 shadow-2xl w-full flex flex-col",
        "border-t rounded-t-2xl max-h-[92dvh]",
        "md:border md:rounded-2xl md:max-h-[90vh]",
        size === "sm" && "md:max-w-sm",
        size === "md" && "md:max-w-lg",
        size === "lg" && "md:max-w-2xl"
      )}>
        {/* drag handle on mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
