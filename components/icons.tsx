const defaultProps = {
  width: 20,
  height: 20,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Icon({ children, size = 20, className }: { children: React.ReactNode; size?: number; className?: string }) {
  return (
    <svg {...defaultProps} width={size} height={size} viewBox="0 0 24 24" className={className}>
      {children}
    </svg>
  );
}

// Dashboard sidebar & pages
export function IconOverview({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Icon>
  );
}

export function IconAgents({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <rect x="5" y="4" width="14" height="14" rx="3" />
      <circle cx="9.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10" r="1" fill="currentColor" stroke="none" />
      <path d="M9.5 15h5" />
      <path d="M12 4V2" />
    </Icon>
  );
}

export function IconTools({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </Icon>
  );
}

// Stat cards
export function IconCheck({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 12l2 2 4-4" />
    </Icon>
  );
}

export function IconArrowUp({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </Icon>
  );
}

// Developer
export function IconCode({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </Icon>
  );
}

// Auth
export function IconWallet({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="17" cy="14" r="1" />
    </Icon>
  );
}

export function IconLock({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
  );
}

export function IconKey({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.85 12.15L19 4" />
      <path d="M18 5l2 2" />
      <path d="M15 8l2 2" />
    </Icon>
  );
}
