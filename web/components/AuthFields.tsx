'use client';

// 로그인 창과 새 비밀번호 화면이 같이 쓰는 입력칸·버튼 (FS 9-11, DESIGN.md 5-6, 6-1, 6-2).
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
      <label htmlFor={inputId} className="block text-sm text-ink">
        {label}
        {hint !== undefined && (
          <span id={hintId} className="ml-2 text-meta text-ink-sub">
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
        className="h-12 w-full rounded-md border border-line bg-surface px-4 text-base text-ink placeholder:text-muted focus-visible:border-brand"
      />
    </div>
  );
}

// DESIGN.md 6-1: 주요 버튼 (보라 채움, 흰 글자)
export function AuthSubmit({ label, disabled }: { label: string; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="h-11 w-full rounded-md bg-brand px-5 text-base font-semibold text-white transition-colors hover:bg-brand-hover active:bg-brand-hover disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
    >
      {label}
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <p role="alert" className="text-sm text-ink">
      {message}
    </p>
  );
}
