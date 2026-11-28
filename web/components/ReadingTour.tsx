'use client';

import { useState, useSyncExternalStore } from 'react';
import { copy } from '@/lib/copy';
import { TOUR_SEEN_KEY, TOUR_SEEN_VALUE, buildTourSteps, parseTourKeys } from '@/lib/tour';

// PRD 4장 F-16, FS 9-8, DESIGN.md 5-1: 종목 화면 알림 띠 + "읽는 순서" 버튼 (status='ok'에서만 StockHeader가 그린다)
// localStorage는 막혀 있을 수 있어서 읽기·쓰기 모두 try/catch로 감싼다. 실패해도 화면은 동작해야 한다 (PRD F-16)

// 저장된 값이 바뀌는 일이 없어 구독은 하지 않는다 (같은 화면 안에서 본 것 표시는 dismissed로 처리)
function subscribeNothing(): () => void {
  return () => {};
}

// 서버 렌더 값: 띠를 그리지 않는다 (저장 값을 알 수 없음)
function serverSeen(): boolean {
  return true;
}

// 저장된 "본 것" 표시를 읽는다. 읽지 못하면 띠만 이 화면에서 숨기고 넘어간다
function isTourSeenStored(): boolean {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === TOUR_SEEN_VALUE;
  } catch (error) {
    // 저장소가 막힌 브라우저: 띠를 이 화면에서만 숨긴다 (FS 9-8). 오류 원인은 다른 곳에 영향이 없다
    void error;
    return true;
  }
}

// 본 것으로 기록한다. 저장이 안 돼도 화면 상태는 그대로 바꾼다 (PRD F-16)
function markTourSeen(): void {
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, TOUR_SEEN_VALUE);
  } catch (error) {
    // 저장 실패는 다음 방문에 띠가 다시 뜨는 것뿐이라 화면은 그대로 둔다
    void error;
  }
}

// 화면에 있는 data-tour 영역을 읽어 말풍선 단계를 만든다 (FS 9-8)
function collectTourSteps(isFinancial: boolean) {
  const values = Array.from(document.querySelectorAll('[data-tour]'), (element) => element.getAttribute('data-tour') ?? '');
  return buildTourSteps(parseTourKeys(values), isFinancial);
}

// driver.js는 누를 때 불러온다 (번들 줄이기, FS 9-8)
async function startTour(isFinancial: boolean): Promise<void> {
  // 단계는 화면에서 먼저 모은다. 보일 단계가 없으면 driver.js를 불러오지 않는다
  const steps = collectTourSteps(isFinancial);
  if (steps.length === 0) return;

  const { driver } = await import('driver.js');
  const tour = driver({
    showProgress: true,
    // DESIGN 6-11: 비추는 카드 모서리는 16px, 바깥은 지정한 덮개 색(0.45)으로 덮는다
    stageRadius: 16,
    overlayColor: 'var(--color-overlay)',
    overlayOpacity: 1,
    // 기본 닫기(✕) 버튼은 뺀다. 건너뛰기는 아래 footer 버튼으로만 한다 (FS 9-8)
    showButtons: ['next', 'previous'],
    progressText: copy.tour.progress,
    prevBtnText: copy.tour.prev,
    nextBtnText: copy.tour.next,
    doneBtnText: copy.tour.done,
    smoothScroll: true,
    allowKeyboardControl: true,
    steps: steps.map((step) => ({
      element: `[data-tour="${step.key}"]`,
      popover: {
        title: step.title,
        description: step.text,
        // 건너뛰기는 driver 기본 닫기 버튼 대신 말풍선 아래에 둔다 (FS 9-8)
        onPopoverRender: (popover) => {
          const skip = document.createElement('button');
          skip.type = 'button';
          skip.className = 'driver-popover-footer-btn';
          skip.textContent = copy.tour.skip;
          skip.addEventListener('click', () => tour.destroy());
          popover.footerButtons.appendChild(skip);
        },
      },
    })),
  });
  tour.drive();
}

export function ReadingTour({ isFinancial }: { isFinancial: boolean }) {
  // 서버 렌더와 첫 하이드레이션에서는 "본 것"으로 보고 띠를 숨긴다. 브라우저에서 마운트 뒤 실제 저장 값을 읽어 띠가 나타난다 (FS 9-8)
  const storedSeen = useSyncExternalStore(subscribeNothing, isTourSeenStored, serverSeen);
  // 이 화면에서 ✕ 또는 투어 시작을 눌렀는지. 저장이 막혀도 화면은 바로 숨긴다 (PRD F-16)
  const [dismissed, setDismissed] = useState(false);
  const bannerVisible = !storedSeen && !dismissed;

  function hideBanner() {
    markTourSeen();
    setDismissed(true);
  }

  function handleStart() {
    markTourSeen();
    setDismissed(true);
    void startTour(isFinancial);
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {bannerVisible && (
        <div
          role="region"
          aria-label={copy.tour.regionLabel}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
        >
          {/* 640px 미만에서는 문장이 한 줄을 쓰고 버튼은 아래 줄로 내려간다 (DESIGN-V2 2-2) */}
          <p className="min-w-0 basis-full sm:flex-1 sm:basis-auto">{copy.tour.banner}</p>
          {/* DESIGN.md 6-1: 보조 버튼 (subtle 바탕 + ink 글자) */}
          <button
            type="button"
            onClick={handleStart}
            className="rounded-md bg-subtle px-3 py-1.5 text-sm font-medium text-ink hover:bg-line"
          >
            {copy.tour.bannerStart}
          </button>
          <button
            type="button"
            onClick={hideBanner}
            aria-label={copy.tour.close}
            className="px-2 py-1 text-sm text-ink-sub hover:text-ink"
          >
            ✕
          </button>
        </div>
      )}
      {/* DESIGN.md 6-1: 보조 버튼 (subtle 바탕 + ink 글자) */}
      <button
        type="button"
        onClick={handleStart}
        className="ml-auto rounded-md bg-subtle px-3 py-1.5 text-sm font-medium text-ink hover:bg-line"
      >
        {copy.tour.fixedButton}
      </button>
    </div>
  );
}
