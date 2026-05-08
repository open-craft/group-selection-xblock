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
  element: HTMLElement,
  initData: Record<string, unknown>,
): void {
  const root = createRoot(element);
  root.render(<StudioView initData={initData} runtime={runtime} />);
}
