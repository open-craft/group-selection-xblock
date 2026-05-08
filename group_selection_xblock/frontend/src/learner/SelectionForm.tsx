/**
 * SelectionForm — the "unselected" state.
 *
 * Renders the question text, radio buttons for each choice, and a submit button.
 * Delegates submission to the parent via onSubmit; the parent handles the
 * confirmation modal and the actual POST.
 */

import React, { useState } from 'react';
import type { Choice } from '../common/types';

export interface SelectionFormProps {
  questionText: string;
  choices: Choice[];
  onSubmit: (choiceId: string, choiceText: string) => void;
  preselectedChoiceId?: string;
  onCancel?: () => void;
  error?: string | null;
  submitting?: boolean;
}

export function SelectionForm({
  questionText,
  choices,
  onSubmit,
  preselectedChoiceId,
  onCancel,
  error,
  submitting = false,
}: SelectionFormProps): React.ReactElement {
  const [selectedId, setSelectedId] = useState<string>(preselectedChoiceId || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedChoiceText =
    choices.find((c) => c.id === selectedId)?.text || selectedId;

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

  return (
    <div className="group-selection-block">
      <p className="group-selection-question">{questionText}</p>

      <form onSubmit={handleSubmit}>
        <div className="group-selection-choices">
          {choices.map((choice) => (
            <label key={choice.id} className="group-selection-choice-label">
              <input
                type="radio"
                name="group-selection-choice"
                value={choice.id}
                checked={selectedId === choice.id}
                onChange={(e) => setSelectedId(e.target.value)}
              />
              <span className="group-selection-choice-text">{choice.text}</span>
            </label>
          ))}
        </div>

        {displayError && (
          <div className="group-selection-error" role="alert">
            {displayError}
          </div>
        )}

        <div className="group-selection-actions">
          <button
            type="submit"
            className="btn btn-primary group-selection-submit-btn"
            disabled={submitting || !selectedId}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
