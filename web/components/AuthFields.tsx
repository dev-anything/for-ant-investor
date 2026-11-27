'use client';

// 로그인 창과 새 비밀번호 화면이 같이 쓰는 입력칸·버튼 (FS 9-11, DESIGN-remember 공통 컨트롤).
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
          <span id={hintId} className="ml-2 text-xs text-ink-sub">
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
        className="w-full rounded border border-muted bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-sub"
      />
    </div>
  );
}

// DESIGN-remember Components button-primary: 주요 버튼 (검정 채움, 흰 글자)
export function AuthSubmit({ label, disabled }: { label: string; disabled: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-md bg-primary px-3 py-2.5 text-sm font-bold text-primary-fg hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
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
