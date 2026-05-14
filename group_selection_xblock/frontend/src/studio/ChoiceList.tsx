/**
 * ChoiceList — renders the dynamic list of choice rows.
 */

import React from 'react';
import type { Choice, ContentGroup } from '../common/types';
import { ChoiceRow } from './ChoiceRow';

export interface ChoiceListProps {
  choices: Choice[];
  contentGroups: ContentGroup[];
  choiceGroupPartitionMap: Record<string, { group_id: number; partition_id: number }>;
  onChoiceChange: (choiceId: string, text: string) => void;
  onGroupChange: (choiceId: string, partitionId: number, groupId: number) => void;
  onDeleteChoice: (choiceId: string) => void;
  onAddChoice: () => void;
}

export function ChoiceList({
  choices,
  contentGroups,
  choiceGroupPartitionMap,
  onChoiceChange,
  onGroupChange,
  onDeleteChoice,
  onAddChoice,
}: ChoiceListProps): React.ReactElement {
  return (
    <div className="group-selection-choicelist">
      {choices.map((choice, index) => (
        <ChoiceRow
          key={choice.id}
          choice={choice}
          index={index}
          contentGroups={contentGroups}
          selectedGroupId={choiceGroupPartitionMap[choice.id]?.group_id || 0}
          onChoiceChange={onChoiceChange}
          onGroupChange={onGroupChange}
          onDelete={onDeleteChoice}
          canDelete={true}
        />
      ))}

      {choices.length === 0 && (
        <p className="group-selection-no-choices">
          No choices added yet. Click "Add Choice" to get started.
        </p>
      )}

      <button
        type="button"
        className="btn btn-primary group-selection-add-choice-btn"
        onClick={onAddChoice}
      >
        Add Choice
      </button>
    </div>
  );
}
