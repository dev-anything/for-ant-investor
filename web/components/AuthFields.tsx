'use client';

// 로그인 창과 새 비밀번호 화면이 같이 쓰는 입력칸·버튼 (FS 9-11).
import { useId, type InputHTMLAttributes } from 'react';

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'className'> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: string;
};

export function AuthField({ label, value, onValueChange, hint, ...inputProps }: AuthFieldProps) {
  const inputId = useId();
  const hintId = useId();

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm text-neutral-700">
        {label}
        {hint !== undefined && (
          <span id={hintId} className="ml-2 text-xs text-neutral-500">
            {hint}
          </span>
        )}
      </label>
      <input
        {...inputProps}
        id={inputId}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        aria-describedby={hint !== undefined ? hintId : undefined}
        className="w-full rounded border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
      />
    </div>
  );
}

export function AuthSubmit({ label, disabled }: { label: string; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded bg-neutral-900 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
    >
      {label}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <p role="alert" className="text-sm text-neutral-900">
      {message}
    </p>
  );
}
