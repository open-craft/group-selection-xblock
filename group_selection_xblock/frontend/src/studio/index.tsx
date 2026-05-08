/**
 * Studio view entry point.
 *
 * Exports renderBlock which is called by the XBlock runtime via
 * fragment.initialize_js('GroupSelectionStudio', initData).
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { StudioView } from './StudioView';

export interface StudioRuntime {
  handlerUrl?: (element: HTMLElement, handlerName: string) => string;
  notify?: (action: string, data?: Record<string, unknown>) => void;
}

export function renderBlock(
  runtime: StudioRuntime,
  element: Element,
  initData: Record<string, unknown>,
): void {
  const container =
    element && 'jquery' in element
      ? (element as unknown as HTMLElement[])[0]
      : element;
  createRoot(container as HTMLElement).render(
    <StudioView initData={initData} runtime={runtime} />,
  );
}
