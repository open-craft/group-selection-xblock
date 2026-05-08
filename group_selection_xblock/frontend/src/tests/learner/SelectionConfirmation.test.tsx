/**
 * Tests for SelectionConfirmation component.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionConfirmation } from '../../learner/SelectionConfirmation';
import type { Choice } from '../../common/types';

const mockChoices: Choice[] = [
  { id: 'opt_it', text: 'IT' },
  { id: 'opt_healthcare', text: 'Healthcare' },
];

describe('SelectionConfirmation', () => {
  it('renders the question text', () => {
    render(
      <SelectionConfirmation
        questionText="Which industry?"
        selectedChoiceId="opt_it"
        choices={mockChoices}
        onChangeClick={jest.fn()}
      />
    );
    expect(screen.getByText('Which industry?')).toBeInTheDocument();
  });

  it('shows the selected choice text', () => {
    render(
      <SelectionConfirmation
        questionText="Q"
        selectedChoiceId="opt_healthcare"
        choices={mockChoices}
        onChangeClick={jest.fn()}
      />
    );
    // The strong element contains "Healthcare".
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
  });

  it('falls back to choice ID when choice is not found', () => {
    render(
      <SelectionConfirmation
        questionText="Q"
        selectedChoiceId="unknown_id"
        choices={mockChoices}
        onChangeClick={jest.fn()}
      />
    );
    expect(screen.getByText('unknown_id')).toBeInTheDocument();
  });

  it('calls onChangeClick when "Change selection" button is clicked', () => {
    const onChangeClick = jest.fn();
    render(
      <SelectionConfirmation
        questionText="Q"
        selectedChoiceId="opt_it"
        choices={mockChoices}
        onChangeClick={onChangeClick}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    expect(onChangeClick).toHaveBeenCalledTimes(1);
  });

  it('renders the confirmation icon container', () => {
    render(
      <SelectionConfirmation
        questionText="Q"
        selectedChoiceId="opt_it"
        choices={mockChoices}
        onChangeClick={jest.fn()}
      />
    );
    expect(
      document.querySelector('.group-selection-confirmation-icon')
    ).toBeInTheDocument();
  });
});
