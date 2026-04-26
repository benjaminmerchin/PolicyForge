type LogoProps = {
  className?: string;
  size?: number;
};

export function Logo({ className, size = 28 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="pf-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.5 0.2 280)" />
          <stop offset="50%" stopColor="oklch(0.55 0.22 25)" />
          <stop offset="100%" stopColor="oklch(0.55 0.18 200)" />
        </linearGradient>
      </defs>
      {/* Hexagonal seal */}
      <path
        d="M16 1.5 L28.6 8.75 L28.6 23.25 L16 30.5 L3.4 23.25 L3.4 8.75 Z"
        stroke="url(#pf-grad)"
        strokeWidth="1.5"
        fill="oklch(0.98 0.01 280 / 0.6)"
      />
      {/* Forked tree branching — symbolizes the forkable government */}
      <path
        d="M16 22 L16 14 M16 14 L11 9 M16 14 L21 9 M11 9 L8.5 6.5 M11 9 L13.5 6.5 M21 9 L18.5 6.5 M21 9 L23.5 6.5"
        stroke="url(#pf-grad)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="16" cy="22.5" r="1.6" fill="url(#pf-grad)" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Logo size={26} />
      <span className="text-[15px] font-medium tracking-tight text-zinc-900">
        PolicyForge
      </span>
    </div>
  );
}
