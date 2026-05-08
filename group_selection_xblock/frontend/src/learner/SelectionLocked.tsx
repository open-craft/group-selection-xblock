/**
 * SelectionLocked — the "selected + locked" state.
 *
 * Shows the learner's current selection with a lock indicator.
 * No change action is available.
 */

import React from 'react';
import { Lock } from '@openedx/paragon/icons';
import type { Choice } from '../common/types';

export interface SelectionLockedProps {
  questionText: string;
  selectedChoiceId: string;
  choices: Choice[];
}

export function SelectionLocked({
  questionText,
  selectedChoiceId,
  choices,
}: SelectionLockedProps): React.ReactElement {
  const selectedChoice = choices.find((c) => c.id === selectedChoiceId);

  return (
    <div className="group-selection-block">
      <p className="group-selection-question">{questionText}</p>

      <div className="group-selection-confirmation">
        <div className="group-selection-confirmation-icon">
          <Lock />
        </div>
        <p className="group-selection-selected-text">
          {selectedChoice?.text || selectedChoiceId}
        </p>
      </div>

    </div>
  );
}
