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

export function IconTasks({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 14l2 2 4-4" />
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

export function IconBotizen({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M12 15l-3-3h6l-3 3z" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
    </Icon>
  );
}

// Stat cards
export function IconClipboard({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
    </Icon>
  );
}

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

export function IconArrowDown({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </Icon>
  );
}

// Quick actions
export function IconPlus({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </Icon>
  );
}

export function IconSearch({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Icon>
  );
}

// Empty state
export function IconInbox({ size, className }: { size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
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
