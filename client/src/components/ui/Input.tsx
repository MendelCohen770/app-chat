import React, { useId } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  error?: string | null;
  hint?: string;
  trailing?: React.ReactNode;
  /** Visually hide the label (still announced to screen readers). */
  hideLabel?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, trailing, hideLabel = false, className = '', id, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id || `inp-${generatedId}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy =
      [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className={
            hideLabel
              ? 'sr-only'
              : 'block text-sm font-medium text-slate-300 mb-1.5'
          }
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy}
            className={[
              'block w-full rounded-md bg-slate-700 px-3 h-11 text-white placeholder:text-slate-400',
              'border border-slate-600 focus:outline-none focus:border-orange-400',
              'focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              trailing ? 'pe-12' : '',
              error ? 'border-red-500 focus:border-red-500' : '',
              className,
            ].join(' ')}
            {...rest}
          />
          {trailing && (
            <div className="absolute inset-y-0 end-2 flex items-center">{trailing}</div>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="mt-1 text-xs text-slate-400">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export default Input;
