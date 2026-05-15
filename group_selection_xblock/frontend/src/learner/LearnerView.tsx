/**
 * LearnerView — root component for the learner-facing selection UI.
 *
 * Always renders SelectionForm. The form handles unselected, selected-editable,
 * and selected-locked states visually. When the learner submits, a confirmation
 * modal is shown before the actual POST. The modal varies depending on
 * allow_change and whether this is a first submission or a change.
 */

import React, { useState } from 'react';
import type { Choice, SelectionData } from '../common/types';
import { postJson } from '../common/api';
import { SelectionForm } from './SelectionForm';
import { ConfirmModal } from './ConfirmModal';

export interface LearnerViewProps {
  initData: Record<string, unknown>;
}

type ModalType = 'first_submit' | 'change_confirm' | 'final_submit';

export function LearnerView({ initData }: LearnerViewProps): React.ReactElement {
  const questionText = initData.question_text as string;
  const choices = initData.choices as Choice[];
  const allowChange = initData.allow_change as boolean;
  const selection = initData.selection as SelectionData | null;
  const handlerUrls = initData.handler_urls as Record<string, string>;
  const submitUrl = handlerUrls?.submit_selection || '';

  const [currentSelection, setCurrentSelection] = useState<SelectionData | null>(selection);

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
    if (currentSelection && currentSelection.choice_id === choiceId) {
      return;
    }

    setSubmitError(null);
    setPendingChoiceId(choiceId);
    setPendingChoiceText(choiceText);

    if (currentSelection) {
      setActiveModal('change_confirm');
    } else if (allowChange) {
      setActiveModal('first_submit');
    } else {
      setActiveModal('final_submit');
    }
  };

  const handleModalCancel = () => {
    clearModal();
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
        // Reload the page so the LMS re-renders with updated content-group
        // membership, making gated content on the same unit visible.
        window.location.reload();
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

  return (
    <div className="group-selection-learner">
      <SelectionForm
        questionText={questionText}
        choices={choices}
        allowChange={allowChange}
        savedSelectionId={currentSelection?.choice_id}
        onSubmit={handleFormSubmit}
        error={submitError}
        submitting={submitting}
      />
      {renderModal()}
    </div>
  );
}
