/**
 * Learner view entry point.
 *
 * Exports renderBlock which is called by the XBlock runtime via
 * fragment.initialize_js('GroupSelectionLearner', initData).
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { LearnerView } from './LearnerView';

export function renderBlock(
  _runtime: unknown,
  element: Element,
  initData: Record<string, unknown>,
): void {
  const container =
    element && 'jquery' in element
      ? (element as unknown as HTMLElement[])[0]
      : element;
  createRoot(container as HTMLElement).render(<LearnerView initData={initData} />);
}
