export const Hedgehog = ({ size }: { size: number }) => (
  <svg viewBox="0 0 100 100" width={size * 0.8} height={size * 0.8}>
    <ellipse cx="50" cy="58" rx="30" ry="26" fill="#8B6914" />
    <ellipse cx="50" cy="62" rx="22" ry="18" fill="#F5DEB3" />
    <polygon points="30,40 22,20 38,35" fill="#5C4A1E" />
    <polygon points="42,32 40,10 52,28" fill="#5C4A1E" />
    <polygon points="54,30 58,8 62,28" fill="#5C4A1E" />
    <polygon points="64,34 72,14 68,36" fill="#5C4A1E" />
    <polygon points="72,42 82,24 74,44" fill="#5C4A1E" />
    <circle cx="40" cy="55" r="4" fill="#1a1a1a" />
    <circle cx="60" cy="55" r="4" fill="#1a1a1a" />
    <circle cx="41.5" cy="53.5" r="1.5" fill="white" />
    <circle cx="61.5" cy="53.5" r="1.5" fill="white" />
    <ellipse cx="50" cy="64" rx="4" ry="3" fill="#D2691E" />
    <path d="M 44 70 Q 50 76 56 70" fill="none" stroke="#6B4226" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
