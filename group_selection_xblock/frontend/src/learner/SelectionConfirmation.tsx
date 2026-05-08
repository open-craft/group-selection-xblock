/**
 * SelectionConfirmation — the "selected + editable" state.
 *
 * Shows the learner's current selection with an option to change it.
 */

import React from 'react';
import { CheckCircle } from '@openedx/paragon/icons';
import type { Choice } from '../common/types';

export interface SelectionConfirmationProps {
  questionText: string;
  selectedChoiceId: string;
  choices: Choice[];
  onChangeClick: () => void;
}

export function SelectionConfirmation({
  questionText,
  selectedChoiceId,
  choices,
  onChangeClick,
}: SelectionConfirmationProps): React.ReactElement {
  const selectedChoice = choices.find((c) => c.id === selectedChoiceId);

  return (
    <div className="group-selection-block">
      <p className="group-selection-question">{questionText}</p>

      <div className="group-selection-confirmation">
        <div className="group-selection-confirmation-icon">
          <CheckCircle />
        </div>
        <p className="group-selection-selected-text">
          {selectedChoice?.text || selectedChoiceId}
        </p>
      </div>

      <button
        type="button"
        className="btn btn-link group-selection-change-btn"
        onClick={onChangeClick}
      >
        Change selection
      </button>
    </div>
  );
}
