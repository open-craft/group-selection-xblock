/**
 * SelectionForm — the persistent learner-facing selection UI.
 *
 * Renders the question text, "Choose one:" heading, radio buttons for each
 * choice, helper text, and a submit button. Delegates submission to the parent
 * via onSubmit; the parent handles the confirmation modal and the actual POST.
 *
 * When a selection is saved and changes are not allowed, unselected options
 * are disabled and the submit button is hidden.
 */

import React, { useState, useEffect } from 'react';
import type { Choice } from '../common/types';

export interface SelectionFormProps {
  questionText: string;
  choices: Choice[];
  allowChange: boolean;
  savedSelectionId?: string;
  onSubmit: (choiceId: string, choiceText: string) => void;
  error?: string | null;
  submitting?: boolean;
}

export function SelectionForm({
  questionText,
  choices,
  allowChange,
  savedSelectionId,
  onSubmit,
  error,
  submitting = false,
}: SelectionFormProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState<string>(savedSelectionId || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(savedSelectionId || '');
  }, [savedSelectionId]);

  const selectedChoiceText =
    choices.find((c) => c.id === selectedId)?.text || selectedId;

  const isLocked = !!savedSelectionId && !allowChange;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setValidationError('Please select an option.');
      return;
    }
    setValidationError(null);
    onSubmit(selectedId, selectedChoiceText);
  };

  const displayError = validationError || error;

  const helperText = isLocked
    ? 'Once submitted, your choice cannot be changed.'
    : 'Change your choice anytime. Your work will be saved if you switch back.';

  const isSubmitDisabled =
    submitting || !selectedId || isLocked || savedSelectionId === selectedId;

  return (
    <div className="group-selection-block">
      <p className="group-selection-question">{questionText}</p>

      <p className="group-selection-choices-heading-text">Choose one:</p>

      <form onSubmit={handleSubmit}>
        <div className="group-selection-choices">
          {choices.map((choice) => {
            const isSelected = selectedId === choice.id;
            const isDisabled = isLocked && !isSelected;
            return (
              <label
                key={choice.id}
                className={`group-selection-choice-label ${
                  isSelected ? 'is-selected' : ''
                } ${isDisabled ? 'is-disabled' : ''}`}
              >
                <input
                  type="radio"
                  name="group-selection-choice"
                  value={choice.id}
                  checked={isSelected}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={isDisabled}
                />
                <span className="group-selection-choice-text">
                  {choice.text}
                </span>
              </label>
            );
          })}
        </div>

        <p className="group-selection-helper-text">{helperText}</p>

        {displayError && (
          <div className="group-selection-error" role="alert">
            {displayError}
          </div>
        )}

        <div className="group-selection-actions">
          <button
            type="submit"
            className="btn btn-primary group-selection-submit-btn"
            disabled={isSubmitDisabled}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
