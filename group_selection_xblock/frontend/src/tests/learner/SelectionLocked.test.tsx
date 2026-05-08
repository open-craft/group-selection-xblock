/**
 * Tests for SelectionLocked component.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SelectionLocked } from '../../learner/SelectionLocked';
import type { Choice } from '../../common/types';

const mockChoices: Choice[] = [
  { id: 'opt_it', text: 'IT' },
  { id: 'opt_healthcare', text: 'Healthcare' },
];

describe('SelectionLocked', () => {
  it('renders the question text', () => {
    render(
      <SelectionLocked
        questionText="Which industry?"
        selectedChoiceId="opt_it"
        choices={mockChoices}
      />
    );
    expect(screen.getByText('Which industry?')).toBeInTheDocument();
  });

  it('shows the selected choice text', () => {
    render(
      <SelectionLocked
        questionText="Q"
        selectedChoiceId="opt_it"
        choices={mockChoices}
      />
    );
    expect(screen.getByText('IT')).toBeInTheDocument();
  });

  it('renders the confirmation icon container', () => {
    render(
      <SelectionLocked
        questionText="Q"
        selectedChoiceId="opt_it"
        choices={mockChoices}
      />
    );
    expect(
      document.querySelector('.group-selection-confirmation-icon')
    ).toBeInTheDocument();
  });

  it('does not render a change button', () => {
    render(
      <SelectionLocked
        questionText="Q"
        selectedChoiceId="opt_it"
        choices={mockChoices}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Change selection' })
    ).not.toBeInTheDocument();
  });
});
