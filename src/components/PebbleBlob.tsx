import React from 'react';

type PebbleBlobProps = {
  className?: string;
  variant?: 'warm' | 'teal' | 'sage';
};

export const PebbleBlob: React.FC<PebbleBlobProps> = ({ className = '', variant = 'teal' }) => {
  const fillPrimary =
    variant === 'warm'
      ? '#F26B5B'
      : variant === 'sage'
        ? '#3FA66B'
        : '#0F766E';
  const fillSecondary =
    variant === 'warm'
      ? '#E9A23B'
      : variant === 'sage'
        ? '#0F766E'
        : '#3FA66B';

  return (
    <svg
      viewBox="0 0 260 190"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M54 38C88 14 148 12 184 36C220 60 236 106 212 140C188 174 128 182 80 166C32 150 20 62 54 38Z"
        fill={fillPrimary}
        opacity="0.12"
      />
      <path
        d="M148 64C178 46 218 62 228 92C238 122 214 156 180 164C146 172 114 148 112 118C110 88 118 82 148 64Z"
        fill={fillSecondary}
        opacity="0.14"
      />
    </svg>
  );
};
