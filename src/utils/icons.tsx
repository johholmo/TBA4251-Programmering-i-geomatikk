// SVG-ikoner med styling - hentet fra SVG repo
export const IconEye = ({ stroke = "#111" }: { stroke?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth="2" />
  </svg>
);

export const IconEyeOff = ({ stroke = "#555" }: { stroke?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 3l18 18" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    <path
      d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-3.07 4.51M6.47 6.47C3.87 8.12 2 12 2 12a17.63 17.63 0 0 0 3.54 4.71"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconTrash = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 6h18" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
      stroke="#dc2626"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
      stroke="#dc2626"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M10 11v6M14 11v6" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
