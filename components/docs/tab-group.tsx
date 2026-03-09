"use client";

import { useState, useEffect } from "react";

interface Tab {
  label: string;
  content: React.ReactNode;
}

export function TabGroup({
  tabs,
  storageKey,
}: {
  tabs: Tab[];
  storageKey?: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!storageKey) return;
    const saved = localStorage.getItem(`ibwt-tab-${storageKey}`);
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (idx >= 0 && idx < tabs.length) setActive(idx);
    }
  }, [storageKey, tabs.length]);

  const select = (idx: number) => {
    setActive(idx);
    if (storageKey) localStorage.setItem(`ibwt-tab-${storageKey}`, String(idx));
  };

  return (
    <div>
      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => select(i)}
            className={`px-4 py-2 text-sm font-medium transition rounded-t-lg ${
              active === i
                ? "text-[#d4af37] border-b-2 border-[#d4af37] bg-[rgba(212,175,55,0.08)]"
                : "text-[#888] hover:text-[#ccc] hover:bg-[rgba(255,255,255,0.03)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{tabs[active]?.content}</div>
    </div>
  );
}
