/**
 * StudioView — root component for the Studio editor form.
 *
 * Manages form state and handles save/cancel actions.
 */

import React, { useCallback, useState } from 'react';
import type { Choice, ContentGroup } from '../common/types';
import { postJson } from '../common/api';
import { ChoiceList } from './ChoiceList';
import type { StudioRuntime } from './index';

export interface StudioViewProps {
  initData: Record<string, unknown>;
  runtime: StudioRuntime;
}

export function StudioView({ initData, runtime }: StudioViewProps): React.ReactElement {
  const blockId = initData.block_id as string;
  const contentGroups = initData.content_groups as ContentGroup[];
  const initialChoices = initData.choices as Choice[];
  const handlerUrls = initData.handler_urls as Record<string, string>;
  const submitUrl = handlerUrls?.studio_submit || '';

  const [questionText, setQuestionText] = useState(initData.question_text as string);
  const [choices, setChoices] = useState<Choice[]>(initialChoices.length > 0 ? initialChoices : []);
  const [choiceGroupPartitionMap, setChoiceGroupPartitionMap] = useState<
    Record<string, { group_id: number; partition_id: number }>
  >((initData.choice_group_partition_map as Record<string, { group_id: number; partition_id: number }>) || {});
  const [allowChange, setAllowChange] = useState(initData.allow_change as boolean);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleChoiceChange = useCallback(
    (choiceId: string, text: string) => {
      setChoices((prev) =>
        prev.map((c) => (c.id === choiceId ? { ...c, text } : c))
      );
    },
    []
  );

  const handleGroupChange = useCallback(
    (choiceId: string, partitionId: number, groupId: number) => {
      setChoiceGroupPartitionMap((prev) => ({
        ...prev,
        [choiceId]: { group_id: groupId, partition_id: partitionId },
      }));
    },
    []
  );

  const handleDeleteChoice = useCallback(
    (choiceId: string) => {
      setChoices((prev) => prev.filter((c) => c.id !== choiceId));
      setChoiceGroupPartitionMap((prev) => {
        const next = { ...prev };
        delete next[choiceId];
        return next;
      });
    },
    []
  );

  const handleAddChoice = useCallback(() => {
    const newChoice: Choice = {
      id: crypto.randomUUID ? crypto.randomUUID() : `choice-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      text: '',
    };
    setChoices((prev) => [...prev, newChoice]);
  }, []);

  const handleSave = async () => {
    setError(null);

    // Client-side validation.
    if (choices.length === 0) {
      setError('Add at least one choice.');
      return;
    }
    for (const choice of choices) {
      if (!choice.text.trim()) {
        setError(`Choice text cannot be empty.`);
        return;
      }
      if (!choiceGroupPartitionMap[choice.id]) {
        setError(`"${choice.text}" has no content group assigned.`);
        return;
      }
    }

    setSaving(true);
    try {
      const result = await postJson(submitUrl, {
        question_text: questionText,
        choices,
        choice_group_partition_map: choiceGroupPartitionMap,
        allow_change: allowChange,
      });

      if (result.success) {
        runtime.notify?.('save');
      } else {
        setError(result.error || 'Save failed.');
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    runtime.notify?.('cancel');
  };

  const courseKey = blockId ? blockId.split('@')[0] : '';

  return (
    <div className="group-selection-block">
      {error && (
        <div className="group-selection-studio-error alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="group-selection-studio-form">
        {/* Instruction field */}
        <div className="group-selection-field">
          <label htmlFor="group-selection-instruction" className="group-selection-field-label">
            Instruction
          </label>
          <textarea
            id="group-selection-instruction"
            className="form-control group-selection-textarea"
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter the instruction or question for learners"
          />
        </div>

        {/* Choices section */}
        <div className="group-selection-field">
          <label className="group-selection-field-label">
            Choices
          </label>
          <ChoiceList
            choices={choices}
            contentGroups={contentGroups}
            choiceGroupPartitionMap={choiceGroupPartitionMap}
            onChoiceChange={handleChoiceChange}
            onGroupChange={handleGroupChange}
            onDeleteChoice={handleDeleteChoice}
            onAddChoice={handleAddChoice}
          />
        </div>

        {/* Allow change checkbox */}
        <div className="group-selection-field">
          <label className="group-selection-checkbox-label">
            <input
              type="checkbox"
              checked={allowChange}
              onChange={(e) => setAllowChange(e.target.checked)}
            />
            <span>Allow learners to change their selection</span>
          </label>
        </div>

        {/* Manage content groups link */}
        {courseKey && (
          <div className="group-selection-field">
            <a
              href={`/group_configurations/${courseKey}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group-selection-manage-link"
            >
              Manage content groups
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="group-selection-studio-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
