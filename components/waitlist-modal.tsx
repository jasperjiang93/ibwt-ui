"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { WaitlistForm } from "@/components/waitlist-form";

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

export function WaitlistModal({ open, onClose }: WaitlistModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-[#888] hover:text-[#e5e5e5] transition text-sm"
        >
          Close ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-[#e5e5e5]">
            Interested? Join the waitlist
          </h2>
          <p className="text-[#888] text-sm mt-2">
            Be first to access the platform when we launch.
          </p>
        </div>

        <WaitlistForm />
      </div>
    </div>,
    document.body
  );
}
