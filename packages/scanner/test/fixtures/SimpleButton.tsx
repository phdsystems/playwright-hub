import React from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function SimpleButton({ label, onClick, disabled }: ButtonProps) {
  return (
    <button
      data-testid="simple-button"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}
