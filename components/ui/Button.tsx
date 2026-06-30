'use client';

import Link from 'next/link';

interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'dark';
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  variant = 'primary',
  href,
  onClick,
  className = '',
  children,
  fullWidth = false,
  type = 'button',
}: ButtonProps) {
  const base = [
    'button-shell inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-3 text-[15px] font-medium',
    `button-${variant}`,
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleMove = (event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const moveX = ((pointerX / rect.width) - 0.5) * 10;
    const moveY = ((pointerY / rect.height) - 0.5) * 8;

    element.style.setProperty('--btn-pointer-x', `${pointerX}px`);
    element.style.setProperty('--btn-pointer-y', `${pointerY}px`);
    element.style.setProperty('--btn-x', `${moveX}px`);
    element.style.setProperty('--btn-y', `${moveY}px`);
  };

  const resetMotion = (event: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
    const element = event.currentTarget as HTMLElement;
    element.style.setProperty('--btn-x', '0px');
    element.style.setProperty('--btn-y', '0px');
    element.style.setProperty('--btn-pointer-x', '50%');
    element.style.setProperty('--btn-pointer-y', '50%');
  };

  if (href) {
    return (
      <Link
        href={href}
        className={base}
        onMouseMove={handleMove}
        onMouseLeave={resetMotion}
        onBlur={resetMotion}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={base}
      onMouseMove={handleMove}
      onMouseLeave={resetMotion}
      onBlur={resetMotion}
    >
      {children}
    </button>
  );
}
