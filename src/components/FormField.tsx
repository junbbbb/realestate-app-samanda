'use client';

import { useStyletron } from 'baseui';

export default function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [css] = useStyletron();
  return (
    <div>
      <label
        className={css({
          display: 'block',
          fontSize: '14px',
          fontWeight: 500,
          color: '#333',
          marginBottom: '6px',
        })}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
