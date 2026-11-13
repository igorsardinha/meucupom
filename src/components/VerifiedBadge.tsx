import React from "react";

interface VerifiedBadgeProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  badgeColor?: string;
  tickColor?: string;
  ringColor?: string;
}

export function VerifiedBadge({
  className = "h-5 w-5",
  badgeColor = "#1E60CF",
  tickColor = "#FFFFFF",
  ringColor = "#070C14",
  ...props
}: VerifiedBadgeProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-label="Perfil Verificado"
      className={className}
      fill="none"
      {...props}
    >
      {ringColor && <circle cx="12" cy="12" r="11.8" fill={ringColor} />}
      <circle cx="12" cy="12" r={ringColor ? "9.8" : "11"} fill={badgeColor} />
      <path
        d="M7.8 12.2l2.8 2.8 5.6-5.6"
        stroke={tickColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
