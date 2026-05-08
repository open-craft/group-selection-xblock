/**
 * ChoiceRow — a single row in the choice list.
 *
 * Contains a text input for the choice text, a content group dropdown
 * to map this choice to a content group, and a delete button.
 */

import React from 'react';
import { Close } from '@openedx/paragon/icons';
import type { Choice, ContentGroup } from '../common/types';
import { ContentGroupDropdown } from './ContentGroupDropdown';

export interface ChoiceRowProps {
  choice: Choice;
  index: number;
  contentGroups: ContentGroup[];
  selectedGroupId: number;
  onChoiceChange: (choiceId: string, text: string) => void;
  onGroupChange: (choiceId: string, partitionId: number, groupId: number) => void;
  onDelete: (choiceId: string) => void;
  canDelete: boolean;
}

export function ChoiceRow({
  choice,
  index,
  contentGroups,
  selectedGroupId,
  onChoiceChange,
  onGroupChange,
  onDelete,
  canDelete,
}: ChoiceRowProps): React.ReactElement {
  return (
    <div className="group-selection-choicerow">
      <span className="group-selection-choicerow-index">{index + 1}.</span>

      <input
        type="text"
        className="form-control group-selection-choicerow-input"
        value={choice.text}
        onChange={(e) => onChoiceChange(choice.id, e.target.value)}
        placeholder="Choice text"
      />

      <ContentGroupDropdown
        choiceId={choice.id}
        contentGroups={contentGroups}
        selectedGroupId={selectedGroupId}
        onChange={onGroupChange}
      />

      {canDelete && (
        <button
          type="button"
          className="btn btn-icon group-selection-delete-btn"
          onClick={() => onDelete(choice.id)}
          title="Remove choice"
        >
          <Close />
        </button>
      )}
    </div>
  );
}
