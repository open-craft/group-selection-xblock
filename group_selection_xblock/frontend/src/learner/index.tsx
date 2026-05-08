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
  element: HTMLElement,
  initData: Record<string, unknown>,
): void {
  const root = createRoot(element);
  root.render(<LearnerView initData={initData} />);
}
