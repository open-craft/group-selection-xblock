/**
 * Tests for ContentGroupDropdown component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentGroupDropdown } from '../../studio/ContentGroupDropdown';
import type { ContentGroup } from '../../common/types';

const mockGroups: ContentGroup[] = [
  { partition_id: 50, group_id: 1, name: 'IT Group' },
  { partition_id: 50, group_id: 2, name: 'Healthcare Group' },
  { partition_id: 60, group_id: 3, name: 'Finance Group' },
];

describe('ContentGroupDropdown', () => {
  it('renders all content group options plus a placeholder', () => {
    render(
      <ContentGroupDropdown
        choiceId="choice-1"
        contentGroups={mockGroups}
        selectedGroupId={0}
        onChange={jest.fn()}
      />
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    // Placeholder + 3 groups = 4 options.
    expect(select.querySelectorAll('option')).toHaveLength(4);
  });

  it('shows the correct selected group', () => {
    render(
      <ContentGroupDropdown
        choiceId="choice-1"
        contentGroups={mockGroups}
        selectedGroupId={2}
        onChange={jest.fn()}
      />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('2');
  });

  it('calls onChange with correct tuple on selection', () => {
    const onChange = jest.fn();
    render(
      <ContentGroupDropdown
        choiceId="choice-abc"
        contentGroups={mockGroups}
        selectedGroupId={0}
        onChange={onChange}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '3' } });
    expect(onChange).toHaveBeenCalledWith('choice-abc', 60, 3);
  });

  it('displays group names as option text', () => {
    render(
      <ContentGroupDropdown
        choiceId="choice-1"
        contentGroups={mockGroups}
        selectedGroupId={0}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText('IT Group')).toBeInTheDocument();
    expect(screen.getByText('Healthcare Group')).toBeInTheDocument();
    expect(screen.getByText('Finance Group')).toBeInTheDocument();
  });
});
