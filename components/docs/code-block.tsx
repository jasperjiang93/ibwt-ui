"use client";

import { useState } from "react";

export function CodeBlock({ children, title }: { children: string; title?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      {title && (
        <div className="px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-gray-800 border-b-0 rounded-t-lg text-xs text-[#888] font-medium">
          {title}
        </div>
      )}
      <pre className={`px-4 py-3 bg-[rgba(255,255,255,0.03)] border border-gray-800 ${title ? "rounded-b-lg" : "rounded-lg"} text-sm font-mono text-[#ccc] overflow-x-auto`}>
        <code>{children}</code>
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 text-xs text-[#888] hover:text-white bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] rounded opacity-0 group-hover:opacity-100 transition"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
