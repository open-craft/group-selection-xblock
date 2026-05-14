/**
 * Tests for ChoiceRow component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoiceRow } from '../../studio/ChoiceRow';
import type { Choice, ContentGroup } from '../../common/types';

const mockChoice: Choice = { id: 'choice-1', text: 'IT' };
const mockGroups: ContentGroup[] = [
  { partition_id: 50, group_id: 1, name: 'IT Group' },
];

describe('ChoiceRow', () => {
  it('renders the choice text input', () => {
    render(
      <ChoiceRow
        choice={mockChoice}
        index={0}
        contentGroups={mockGroups}
        selectedGroupId={0}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDelete={jest.fn()}
        canDelete={true}
      />
    );
    const input = screen.getByPlaceholderText('Choice text') as HTMLInputElement;
    expect(input.value).toBe('IT');
  });

  it('uses the index in the remove button label', () => {
    render(
      <ChoiceRow
        choice={mockChoice}
        index={2}
        contentGroups={mockGroups}
        selectedGroupId={0}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDelete={jest.fn()}
        canDelete={true}
      />
    );
    expect(screen.getByRole('button', { name: 'Remove choice 3' })).toBeInTheDocument();
  });

  it('calls onChoiceChange when text is edited', () => {
    const onChoiceChange = jest.fn();
    render(
      <ChoiceRow
        choice={mockChoice}
        index={0}
        contentGroups={mockGroups}
        selectedGroupId={0}
        onChoiceChange={onChoiceChange}
        onGroupChange={jest.fn()}
        onDelete={jest.fn()}
        canDelete={true}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Choice text'), {
      target: { value: 'New text' },
    });
    expect(onChoiceChange).toHaveBeenCalledWith('choice-1', 'New text');
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(
      <ChoiceRow
        choice={mockChoice}
        index={0}
        contentGroups={mockGroups}
        selectedGroupId={0}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDelete={onDelete}
        canDelete={true}
      />
    );
    fireEvent.click(screen.getByTitle('Remove choice'));
    expect(onDelete).toHaveBeenCalledWith('choice-1');
  });

  it('hides delete button when canDelete is false', () => {
    render(
      <ChoiceRow
        choice={mockChoice}
        index={0}
        contentGroups={mockGroups}
        selectedGroupId={0}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDelete={jest.fn()}
        canDelete={false}
      />
    );
    expect(screen.queryByTitle('Remove choice')).not.toBeInTheDocument();
  });

  it('renders ContentGroupDropdown with the selected group', () => {
    render(
      <ChoiceRow
        choice={mockChoice}
        index={0}
        contentGroups={mockGroups}
        selectedGroupId={1}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDelete={jest.fn()}
        canDelete={true}
      />
    );
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('1');
  });
});
