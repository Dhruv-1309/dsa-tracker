import { Box, Typography } from '@mui/material';

interface LogoProps {
  size?: number; // height of icon in px
  showWordmark?: boolean;
  variant?: 'default' | 'inverted';
  sx?: object;
}

export function LogoIcon({
  width = 38,
  height = 28,
  className,
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
}) {
  return (
    <svg
      role="img"
      aria-label="DSA Tracker checkmark matrix icon"
      width={width}
      height={height}
      viewBox="0 0 130 96"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0 }}
      className={className}
    >
      <rect x="0" y="0" width="28" height="28" rx="6" fill="#ddd9fc" />
      <rect x="34" y="0" width="28" height="28" rx="6" fill="#c4befa" />
      <rect x="68" y="0" width="28" height="28" rx="6" fill="#ddd9fc" />
      <rect x="102" y="0" width="28" height="28" rx="6" fill="#15803d" />
      <rect x="0" y="34" width="28" height="28" rx="6" fill="#4f3ff0" />
      <rect x="34" y="34" width="28" height="28" rx="6" fill="#ddd9fc" />
      <rect x="68" y="34" width="28" height="28" rx="6" fill="#4f3ff0" />
      <rect x="102" y="34" width="28" height="28" rx="6" fill="#c4befa" />
      <rect x="0" y="68" width="28" height="28" rx="6" fill="#ddd9fc" />
      <rect x="34" y="68" width="28" height="28" rx="6" fill="#4f3ff0" />
      <rect x="68" y="68" width="28" height="28" rx="6" fill="#a79ff6" />
      <rect x="102" y="68" width="28" height="28" rx="6" fill="#c4befa" />
    </svg>
  );
}

export default function Logo({
  size = 28,
  showWordmark = true,
  variant = 'default',
  sx = {},
}: LogoProps) {
  const iconHeight = size;
  const iconWidth = Math.round((size * 130) / 96);
  const fontSize = Math.round(size * 0.72);

  const isInverted = variant === 'inverted';
  const dsaColor = isInverted ? '#A49BFF' : '#4F3FF0';
  const trackerColor = isInverted ? '#FFFFFF' : '#16143A';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: `${Math.max(8, Math.round(size * 0.3))}px`,
        textDecoration: 'none',
        userSelect: 'none',
        ...sx,
      }}
    >
      <LogoIcon width={iconWidth} height={iconHeight} />
      {showWordmark && (
        <Typography
          component="span"
          sx={{
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            fontSize: `${fontSize}px`,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontWeight: 700, color: dsaColor }}>DSA</span>{' '}
          <span style={{ fontWeight: 500, color: trackerColor }}>Tracker</span>
        </Typography>
      )}
    </Box>
  );
}
