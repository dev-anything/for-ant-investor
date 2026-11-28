'use client';

import { Info } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { getTooltipPlacement, type TooltipPlacement } from '@/lib/tooltip-position';

// FS 7장, DESIGN.md 6-10: ⓘ 트리거 + 흰 팝오버.
// 마우스 올림·포커스·탭으로 열리고, Esc·바깥 클릭으로 닫힌다 (기존 동작 유지).
// 정식 이름을 따로 가진 copy 키가 없으므로 문구는 한 문단 그대로 14px로 둔다.
// SSR에서 useLayoutEffect 경고가 나지 않게 클라이언트에서만 레이아웃 효과를 쓴다.
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function Tooltip({ text, label }: { text: string; label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<TooltipPlacement | null>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
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

  // DESIGN-V2 2-4: 열 때 트리거·화면·팝오버 높이를 한 번만 재서 자리를 정한다.
  useClientLayoutEffect(() => {
    if (!isOpen) return;
    const trigger = buttonRef.current?.getBoundingClientRect();
    const tip = tipRef.current;
    if (!trigger || !tip) return;
    setPlacement(
      getTooltipPlacement(
        { left: trigger.left, right: trigger.right, top: trigger.top, bottom: trigger.bottom },
        { width: window.innerWidth, height: window.innerHeight },
        tip.offsetHeight,
      ),
    );
  }, [isOpen]);

  const isCenter = placement?.horizontal === 'center';
  const isAbove = placement?.vertical === 'top';
  const tipClass = [
    'z-50 max-w-[calc(100vw-2rem)] rounded-md border border-line bg-white p-4 text-left text-sm text-ink-sub shadow-[0_8px_24px_rgb(0_0_0/0.08)]',
    isCenter
      ? 'fixed left-1/2 -translate-x-1/2'
      : `absolute ${placement?.horizontal === 'right' ? 'right-0' : 'left-0'} ${isAbove ? 'bottom-full mb-1' : 'top-full mt-1'}`,
  ].join(' ');
  const tipStyle: CSSProperties = {
    width: placement?.width ?? 280,
    ...(isCenter
      ? isAbove
        ? { bottom: placement?.fixedBottom ?? undefined }
        : { top: placement?.fixedTop ?? undefined }
      : {}),
  };

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-describedby={tipId}
        aria-expanded={isOpen}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-ink"
      >
        <Info size={16} strokeWidth={2} aria-hidden="true" />
      </button>
      <span
        ref={tipRef}
        id={tipId}
        role="tooltip"
        hidden={!isOpen}
        className={tipClass}
        style={tipStyle}
      >
        {text}
      </span>
    </span>
  );
}
