/**
 * ContentGroupDropdown — a <select> populated with course content groups.
 *
 * Each option carries both partition_id and group_id so the mapping
 * can be saved in a single selection.
 */

import React from 'react';
import type { ContentGroup } from '../common/types';

export interface ContentGroupDropdownProps {
  choiceId: string;
  contentGroups: ContentGroup[];
  selectedGroupId: number;
  onChange: (choiceId: string, partitionId: number, groupId: number) => void;
}

export function ContentGroupDropdown({
  choiceId,
  contentGroups,
  selectedGroupId,
  onChange,
}: ContentGroupDropdownProps): React.ReactElement {
  return (
    <select
      className="form-control group-selection-group-dropdown"
      value={selectedGroupId || ''}
      onChange={(e) => {
        const selected = contentGroups.find(
          (g) => g.group_id === Number(e.target.value)
        );
        if (selected) {
          onChange(choiceId, selected.partition_id, selected.group_id);
        }
      }}
    >
      <option value="" disabled>
        Content group*
      </option>
      {contentGroups.map((group) => (
        <option
          key={`${group.partition_id}-${group.group_id}`}
          value={group.group_id}
        >
          {group.name}
        </option>
      ))}
    </select>
  );
}
