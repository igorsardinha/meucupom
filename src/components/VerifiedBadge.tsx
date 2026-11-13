import React from "react";

interface VerifiedBadgeProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  badgeColor?: string;
  tickColor?: string;
}

export function VerifiedBadge({
  className = "h-5 w-5",
  badgeColor = "#1E60CF",
  tickColor = "#FFFFFF",
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
      {/* 12-point scalloped verified badge */}
      <path
        d="M22.5 12c0-.98-.44-1.87-1.15-2.48.24-.71.27-1.5.07-2.27-.3-1.15-1.19-2.04-2.34-2.34-.77-.2-1.56-.17-2.27.07-.61-.71-1.5-1.15-2.48-1.15s-1.87.44-2.48 1.15c-.71-.24-1.5-.27-2.27-.07-1.15.3-2.04 1.19-2.34 2.34-.2.77-.17 1.56.07 2.27-.71.61-1.15 1.5-1.15 2.48s.44 1.87 1.15 2.48c-.24.71-.27 1.5-.07 2.27.3 1.15 1.19 2.04 2.34 2.34.77.2 1.56.17 2.27-.07.61.71 1.5 1.15 2.48 1.15s1.87-.44 2.48-1.15c.71.24 1.5.27 2.27.07 1.15-.3 2.04-1.19 2.34-2.34.2-.77.17-1.56-.07-2.27.71-.61 1.15-1.5 1.15-2.48z"
        fill={badgeColor}
      />
      {/* Clean, bold checkmark / tick */}
      <path
        d="M8.8 12.3l2.4 2.4 4.8-4.8"
        stroke={tickColor}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
