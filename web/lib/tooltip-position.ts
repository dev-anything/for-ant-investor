// DESIGN-V2.md 2-4, FS 7장 Tooltip: 팝오버가 화면 밖으로 나가 가로 스크롤이 생기지 않게 자리를 정한다.
// 열 때 한 번만 계산하고 리사이즈 중에는 다시 재지 않으므로, 판정만 순수 함수로 빼서 테스트한다.

export const TOOLTIP_MAX_WIDTH = 280;
export const TOOLTIP_EDGE_MARGIN = 16;
export const TOOLTIP_GAP = 4;

export type TooltipTriggerBox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type TooltipViewport = {
  width: number;
  height: number;
};

export type TooltipPlacement = {
  horizontal: 'left' | 'right' | 'center';
  vertical: 'bottom' | 'top';
  width: number;
  /** 가운데 + 아래 배치에서 화면 위쪽 기준 px. 그 외에는 null. */
  fixedTop: number | null;
  /** 가운데 + 위 배치에서 화면 아래쪽 기준 px. 그 외에는 null. */
  fixedBottom: number | null;
};

/** 트리거 위치·화면 크기·팝오버 높이로 열리는 방향과 폭을 정한다. */
export function getTooltipPlacement(
  trigger: TooltipTriggerBox,
  viewport: TooltipViewport,
  popupHeight: number,
): TooltipPlacement {
  const width = Math.min(TOOLTIP_MAX_WIDTH, viewport.width - TOOLTIP_EDGE_MARGIN * 2);
  const spaceRight = viewport.width - trigger.right;
  const spaceLeft = trigger.left;

  let horizontal: TooltipPlacement['horizontal'];
  if (spaceRight >= TOOLTIP_MAX_WIDTH + TOOLTIP_EDGE_MARGIN) {
    horizontal = 'left';
  } else if (spaceLeft >= TOOLTIP_MAX_WIDTH + TOOLTIP_EDGE_MARGIN) {
    horizontal = 'right';
  } else {
    horizontal = 'center';
  }

  const hasRoomBelow = viewport.height - trigger.bottom >= popupHeight + TOOLTIP_GAP;
  const vertical: TooltipPlacement['vertical'] = hasRoomBelow ? 'bottom' : 'top';

  return {
    horizontal,
    vertical,
    width,
    fixedTop: horizontal === 'center' && vertical === 'bottom' ? trigger.bottom + TOOLTIP_GAP : null,
    fixedBottom: horizontal === 'center' && vertical === 'top' ? viewport.height - trigger.top + TOOLTIP_GAP : null,
  };
}
