/**
 * LearnerView — root component for the learner-facing selection UI.
 *
 * Determines which sub-component to render based on selection state:
 * - No selection → SelectionForm (unselected state)
 * - Has selection + allow_change → SelectionConfirmation (editable state)
 * - Has selection + !allow_change → SelectionLocked (locked state)
 *
 * When the learner submits, a confirmation modal is shown before the
 * actual POST. The modal varies depending on allow_change and whether
 * this is a first submission or a change.
 */

import React, { useState } from 'react';
import type { Choice, SelectionData } from '../common/types';
import { postJson } from '../common/api';
import { SelectionForm } from './SelectionForm';
import { SelectionConfirmation } from './SelectionConfirmation';
import { SelectionLocked } from './SelectionLocked';
import { ConfirmModal } from './ConfirmModal';

export interface LearnerViewProps {
  initData: Record<string, unknown>;
}

type ViewState = 'unselected' | 'selected_editable' | 'selected_locked' | 'changing';
type ModalType = 'first_submit' | 'change_confirm' | 'final_submit';

export function LearnerView({ initData }: LearnerViewProps): React.ReactElement {
  const questionText = initData.question_text as string;
  const choices = initData.choices as Choice[];
  const allowChange = initData.allow_change as boolean;
  const selection = initData.selection as SelectionData | null;
  const handlerUrls = initData.handler_urls as Record<string, string>;
  const submitUrl = handlerUrls?.submit_selection || '';

  const [currentSelection, setCurrentSelection] = useState<SelectionData | null>(selection);
  const [viewState, setViewState] = useState<ViewState>(() => {
    if (selection) {
      return allowChange ? 'selected_editable' : 'selected_locked';
    }
    return 'unselected';
  });

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType | null>(null);
  const [pendingChoiceId, setPendingChoiceId] = useState<string>('');
  const [pendingChoiceText, setPendingChoiceText] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clearModal = () => {
    setActiveModal(null);
    setPendingChoiceId('');
    setPendingChoiceText('');
  };

  const handleFormSubmit = (choiceId: string, choiceText: string) => {
    setSubmitError(null);
    setPendingChoiceId(choiceId);
    setPendingChoiceText(choiceText);

    if (viewState === 'changing') {
      setActiveModal('change_confirm');
    } else if (allowChange) {
      setActiveModal('first_submit');
    } else {
      setActiveModal('final_submit');
    }
  };

  const handleModalCancel = () => {
    clearModal();
    if (viewState === 'changing') {
      // Return to confirmation with the existing selection intact
      setViewState('selected_editable');
    }
    // For 'unselected' state, just stay on the form
  };

  const handleModalConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await postJson(submitUrl, {
        choice_id: pendingChoiceId,
      });

      if (result.success && result.choice_id && result.choice_text) {
        clearModal();
        setCurrentSelection({
          choice_id: result.choice_id,
          content_group_id: result.content_group_id ?? 0,
          cohort_id: result.cohort_id ?? null,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          can_change: allowChange,
        });
        setViewState(allowChange ? 'selected_editable' : 'selected_locked');
      } else {
        setSubmitError(result.error || 'An unexpected error occurred.');
        clearModal();
      }
    } catch {
      setSubmitError('An unexpected error occurred.');
      clearModal();
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeClick = () => {
    setViewState('changing');
  };

  const handleCancelChange = () => {
    setViewState('selected_editable');
  };

  // --- Render helpers ---

  const renderForm = (isChangeMode: boolean) => (
    <SelectionForm
      questionText={questionText}
      choices={choices}
      onSubmit={handleFormSubmit}
      preselectedChoiceId={isChangeMode ? currentSelection?.choice_id : undefined}
      onCancel={isChangeMode ? handleCancelChange : undefined}
      error={submitError}
      submitting={submitting}
    />
  );

  const renderModal = () => {
    if (!activeModal) return null;

    if (activeModal === 'first_submit') {
      return (
        <ConfirmModal
          heading="You can change your selection later"
          body="Come back to this page to change your selection at any time."
          cancelLabel="Cancel"
          confirmLabel="Continue"
          onCancel={handleModalCancel}
          onConfirm={handleModalConfirm}
        />
      );
    }

    if (activeModal === 'change_confirm') {
      return (
        <ConfirmModal
          heading="Change your selection?"
          body="Any work completed in your previous option, will be saved. Switching back will restore your previous progress."
          cancelLabel="Cancel"
          confirmLabel="Change"
          onCancel={handleModalCancel}
          onConfirm={handleModalConfirm}
        />
      );
    }

    if (activeModal === 'final_submit') {
      return (
        <ConfirmModal
          heading="Submit your choice?"
          body="Once you click submit, you won't be able to change your selection."
          cancelLabel="Cancel"
          confirmLabel="Submit"
          onCancel={handleModalCancel}
          onConfirm={handleModalConfirm}
        />
      );
    }

    return null;
  };

  // --- Main render ---

  if (viewState === 'unselected' || viewState === 'changing') {
    return (
      <div className="group-selection-learner">
        {renderForm(viewState === 'changing')}
        {renderModal()}
      </div>
    );
  }

  if (viewState === 'selected_locked' && currentSelection) {
    return (
      <div className="group-selection-learner">
        <SelectionLocked
          questionText={questionText}
          selectedChoiceId={currentSelection.choice_id}
          choices={choices}
        />
      </div>
    );
  }

  if (viewState === 'selected_editable' && currentSelection) {
    return (
      <div className="group-selection-learner">
        <SelectionConfirmation
          questionText={questionText}
          selectedChoiceId={currentSelection.choice_id}
          choices={choices}
          onChangeClick={handleChangeClick}
        />
      </div>
    );
  }

  return <div />;
}
