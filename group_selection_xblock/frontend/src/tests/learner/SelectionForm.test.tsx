/**
 * Tests for SelectionForm component.
 *
 * SelectionForm delegates submission to the parent via onSubmit.
 * The parent (LearnerView) handles modal logic and the actual POST.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionForm } from '../../learner/SelectionForm';
import type { Choice } from '../../common/types';

const mockChoices: Choice[] = [
  { id: 'opt_it', text: 'IT' },
  { id: 'opt_healthcare', text: 'Healthcare' },
];

describe('SelectionForm', () => {
  const onSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the question text', () => {
    render(
      <SelectionForm
        questionText="Which industry?"
        choices={mockChoices}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByText('Which industry?')).toBeInTheDocument();
  });

  it('renders a radio button for each choice', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByLabelText('IT')).toBeInTheDocument();
    expect(screen.getByLabelText('Healthcare')).toBeInTheDocument();
  });

  it('disables the submit button when no choice is selected', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
      />
    );
    const btn = screen.getByRole('button', { name: 'Submit' });
    expect(btn).toBeDisabled();
  });

  it('enables submit when a radio is selected', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByLabelText('IT'));
    const btn = screen.getByRole('button', { name: 'Submit' });
    expect(btn).toBeEnabled();
  });

  it('shows validation error when submitting with no selection', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
      />
    );
    // Button is disabled but form submit event can still fire.
    // Use fireEvent.submit on the form element.
    const form = screen.getByRole('button', { name: 'Submit' }).closest('form')!;
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent('Please select an option.');
  });

  it('calls onSubmit with the selected choice id and text', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
      />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith('opt_it', 'IT');
  });

  it('displays error from the error prop', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
        error="Server error occurred."
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Server error occurred.');
  });

  it('shows "Submitting..." when submitting prop is true', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
        submitting={true}
      />
    );
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
  });

  it('preselects a choice when preselectedChoiceId is given', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
        preselectedChoiceId="opt_healthcare"
      />
    );
    const radio = screen.getByLabelText('Healthcare') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('renders a Cancel button when onCancel is provided', () => {
    const onCancel = jest.fn();
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not render Cancel button when onCancel is not provided', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        onSubmit={onSubmit}
      />
    );
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });
});
