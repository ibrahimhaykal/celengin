// Celengin's logo: a chicken piggy bank ("celengan ayam"). Drop-in for a lucide icon (size / className props).
// Body uses currentColor; comb, beak, wing and feet use a softer tone; the coin slot and eye are cut out.
// Same shapes as electron/make-icon.cjs — keep them in sync.
import { useId } from 'react';

export default function CelenganAyam({ size = 24, className = '', title }) {
  // Unique per instance (the icon can appear many times on a page); useId may contain ":" / "«»", unsafe in url(#…).
  const mask = `celengin-holes-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="16 40 220 190"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <mask id={mask}>
          <rect x="0" y="0" width="256" height="256" fill="white" />
          <rect x="100" y="96" width="42" height="10" rx="5" fill="black" />
          <circle cx="176" cy="90" r="6" fill="black" />
        </mask>
      </defs>
      <g mask={`url(#${mask})`}>
        <g fill="currentColor">
          <polygon points="74,136 28,78 60,74 98,108" />
          <ellipse cx="124" cy="152" rx="74" ry="60" />
          <circle cx="170" cy="98" r="34" />
        </g>
        <g fill="currentColor" opacity="0.55">
          <circle cx="150" cy="62" r="12" />
          <circle cx="167" cy="55" r="13" />
          <circle cx="184" cy="62" r="12" />
          <polygon points="200,88 226,100 200,112" />
          <ellipse cx="197" cy="122" rx="7" ry="11" />
          <ellipse cx="112" cy="158" rx="34" ry="21" />
          <rect x="98" y="204" width="20" height="16" rx="6" />
          <rect x="136" y="204" width="20" height="16" rx="6" />
        </g>
      </g>
    </svg>
  );
}
