/**
 * Tests for ChoiceList component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChoiceList } from '../../studio/ChoiceList';
import type { Choice, ContentGroup } from '../../common/types';

const mockGroups: ContentGroup[] = [
  { partition_id: 50, group_id: 1, name: 'IT Group' },
];

describe('ChoiceList', () => {
  it('renders each choice as a row', () => {
    const choices: Choice[] = [
      { id: 'a', text: 'First' },
      { id: 'b', text: 'Second' },
    ];
    render(
      <ChoiceList
        choices={choices}
        contentGroups={mockGroups}
        choiceGroupPartitionMap={{}}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDeleteChoice={jest.fn()}
        onAddChoice={jest.fn()}
      />
    );
    expect(screen.getByDisplayValue('First')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
  });

  it('shows empty state when no choices', () => {
    render(
      <ChoiceList
        choices={[]}
        contentGroups={mockGroups}
        choiceGroupPartitionMap={{}}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDeleteChoice={jest.fn()}
        onAddChoice={jest.fn()}
      />
    );
    expect(screen.getByText(/No choices added yet/)).toBeInTheDocument();
  });

  it('calls onAddChoice when the add button is clicked', () => {
    const onAddChoice = jest.fn();
    render(
      <ChoiceList
        choices={[]}
        contentGroups={mockGroups}
        choiceGroupPartitionMap={{}}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDeleteChoice={jest.fn()}
        onAddChoice={onAddChoice}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '+ Add Choice' }));
    expect(onAddChoice).toHaveBeenCalledTimes(1);
  });

  it('assigns correct index to each choice row', () => {
    const choices: Choice[] = [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
    ];
    render(
      <ChoiceList
        choices={choices}
        contentGroups={mockGroups}
        choiceGroupPartitionMap={{}}
        onChoiceChange={jest.fn()}
        onGroupChange={jest.fn()}
        onDeleteChoice={jest.fn()}
        onAddChoice={jest.fn()}
      />
    );
    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
  });
});
