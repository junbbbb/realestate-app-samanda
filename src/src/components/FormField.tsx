'use client';

import { FormControl } from 'baseui/form-control';

export default function FormField({
  label,
  caption,
  error,
  children,
}: {
  label: string;
  caption?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <FormControl label={label} caption={caption} error={error}>
      {children}
    </FormControl>
  );
}
