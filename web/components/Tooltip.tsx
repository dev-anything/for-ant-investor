'use client';

import { useEffect, useId, useRef, useState } from 'react';

// FS 7장 Tooltip: 버튼 트리거 + 말풍선. 마우스 올림·포커스·탭으로 열리고, Esc·바깥 클릭으로 닫힌다.
// 말풍선은 항상 DOM에 두고 hidden으로 숨겨서 aria-describedby가 늘 가리키는 곳이 있게 한다.
export function Tooltip({ text, label }: { text: string; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  // Esc 키와 바깥 클릭으로 닫는다 (열려 있을 때만 리스너를 붙인다)
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handlePointer = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handlePointer);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handlePointer);
    };
  }, [isOpen]);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={tipId}
        aria-expanded={isOpen}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-400 text-xs text-neutral-600"
      >
        ?
      </button>
      {/* 작은 화면에서 화면 밖으로 나가지 않게 폭을 제한하고 왼쪽 기준으로 붙인다 */}
      <span
        id={tipId}
        role="tooltip"
        hidden={!isOpen}
        className="absolute top-full left-0 z-10 mt-1 w-56 max-w-[calc(100vw-2rem)] rounded border border-neutral-300 bg-white px-3 py-2 text-left text-sm text-neutral-800 shadow"
      >
        {text}
      </span>
    </span>
  );
}

