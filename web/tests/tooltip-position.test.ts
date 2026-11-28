import { describe, expect, it } from 'vitest';
import {
  getTooltipPlacement,
  TOOLTIP_EDGE_MARGIN,
  TOOLTIP_GAP,
  TOOLTIP_MAX_WIDTH,
  type TooltipTriggerBox,
  type TooltipViewport,
} from '@/lib/tooltip-position';

const wide: TooltipViewport = { width: 1440, height: 900 };
const popupHeight = 120;

function triggerAt(left: number, top = 100, right = left + 20, bottom = top + 20): TooltipTriggerBox {
  return { left, right, top, bottom };
}

describe('getTooltipPlacement 가로 배치', () => {
  it('오른쪽에 280px + 16px가 남으면 트리거 왼쪽 끝에서 연다', () => {
    const result = getTooltipPlacement(triggerAt(100), wide, popupHeight);
    expect(result.horizontal).toBe('left');
    expect(result.width).toBe(280);
  });

  it('오른쪽 여유가 정확히 296px면 왼쪽 기준으로 연다 (경계값)', () => {
    const needed = TOOLTIP_MAX_WIDTH + TOOLTIP_EDGE_MARGIN;
    const result = getTooltipPlacement(triggerAt(wide.width - needed - 20), wide, popupHeight);
    expect(result.horizontal).toBe('left');
  });

  it('오른쪽 여유가 295px면 왼쪽 기준으로 열지 않는다 (경계값)', () => {
    const needed = TOOLTIP_MAX_WIDTH + TOOLTIP_EDGE_MARGIN;
    const result = getTooltipPlacement(triggerAt(wide.width - needed - 20 + 1), wide, popupHeight);
    expect(result.horizontal).not.toBe('left');
  });

  it('오른쪽이 부족하고 왼쪽에 296px가 남으면 트리거 오른쪽 끝에서 연다', () => {
    const result = getTooltipPlacement(triggerAt(1180), wide, popupHeight);
    expect(result.horizontal).toBe('right');
  });

  it('양쪽 다 296px가 안 되면 화면 가운데에 연다 (좁은 모바일)', () => {
    const narrow: TooltipViewport = { width: 360, height: 640 };
    const result = getTooltipPlacement(triggerAt(170, 100, 190, 120), narrow, popupHeight);
    expect(result.horizontal).toBe('center');
    expect(result.width).toBe(280);
  });

  it('화면이 280px보다 좁으면 폭은 100vw − 32px가 된다', () => {
    const narrow: TooltipViewport = { width: 280, height: 640 };
    const result = getTooltipPlacement(triggerAt(130, 100, 150, 120), narrow, popupHeight);
    expect(result.width).toBe(248);
  });
});

describe('getTooltipPlacement 세로 배치와 가운데 기준 좌표', () => {
  it('아래에 팝오버 높이 + 4px가 남으면 아래로 연다', () => {
    const result = getTooltipPlacement(triggerAt(100, 100, 120, 120), wide, popupHeight);
    expect(result.vertical).toBe('bottom');
  });

  it('아래 여유가 정확히 팝오버 높이 + 4px면 아래로 연다 (경계값)', () => {
    const viewport: TooltipViewport = { width: 1440, height: 300 };
    const result = getTooltipPlacement(triggerAt(100, 100, 120, 176), viewport, popupHeight);
    expect(result.vertical).toBe('bottom');
  });

  it('아래 여유가 1px 모자라면 위로 연다', () => {
    const viewport: TooltipViewport = { width: 1440, height: 300 };
    const result = getTooltipPlacement(triggerAt(100, 100, 120, 177), viewport, popupHeight);
    expect(result.vertical).toBe('top');
  });

  it('가운데 + 아래 배치는 트리거 아래 4px를 fixed top으로 준다', () => {
    const narrow: TooltipViewport = { width: 360, height: 640 };
    const result = getTooltipPlacement(triggerAt(170, 100, 190, 120), narrow, popupHeight);
    expect(result).toMatchObject({
      horizontal: 'center',
      vertical: 'bottom',
      fixedTop: 120 + TOOLTIP_GAP,
      fixedBottom: null,
    });
  });

  it('가운데 + 위 배치는 화면 아래에서 트리거 위 4px를 fixed bottom으로 준다', () => {
    const narrow: TooltipViewport = { width: 360, height: 640 };
    const result = getTooltipPlacement(triggerAt(170, 580, 190, 600), narrow, popupHeight);
    expect(result).toMatchObject({
      horizontal: 'center',
      vertical: 'top',
      fixedTop: null,
      fixedBottom: 640 - 580 + TOOLTIP_GAP,
    });
  });

  it('왼쪽·오른쪽 배치에서는 fixed 좌표를 쓰지 않는다', () => {
    const leftResult = getTooltipPlacement(triggerAt(100), wide, popupHeight);
    const rightResult = getTooltipPlacement(triggerAt(1180), wide, popupHeight);
    expect(leftResult.fixedTop).toBeNull();
    expect(leftResult.fixedBottom).toBeNull();
    expect(rightResult.fixedTop).toBeNull();
    expect(rightResult.fixedBottom).toBeNull();
  });
});
