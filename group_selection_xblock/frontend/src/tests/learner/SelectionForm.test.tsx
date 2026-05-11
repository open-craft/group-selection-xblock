/**
 * Tests for SelectionForm component.
 *
 * SelectionForm is always visible and handles unselected, editable, and locked
 * states. It delegates submission to the parent via onSubmit.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectionForm } from '../../learner/SelectionForm';
import type { Choice } from '../../common/types';

const mockChoices: Choice[] = [
  { id: 'opt_it', text: 'IT' },
  { id: 'opt_healthcare', text: 'Healthcare' },
  { id: 'opt_education', text: 'Education' },
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
        allowChange={true}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByText('Which industry?')).toBeInTheDocument();
  });

  it('renders "Choose one:" heading', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={true}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByText('Choose one:')).toBeInTheDocument();
  });

  it('renders a radio button for each choice', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={true}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByLabelText('IT')).toBeInTheDocument();
    expect(screen.getByLabelText('Healthcare')).toBeInTheDocument();
    expect(screen.getByLabelText('Education')).toBeInTheDocument();
  });

  it('shows editable helper text when no saved selection', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={true}
        onSubmit={onSubmit}
      />
    );
    expect(
      screen.getByText('Change your choice anytime. Your work will be saved if you switch back.')
    ).toBeInTheDocument();
  });

  it('shows locked helper text when saved selection exists and allowChange=false', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={false}
        savedSelectionId="opt_it"
        onSubmit={onSubmit}
      />
    );
    expect(
      screen.getByText('Once submitted, your choice cannot be changed.')
    ).toBeInTheDocument();
  });

  it('disables the submit button when no choice is selected', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={true}
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
        allowChange={true}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByLabelText('IT'));
    const btn = screen.getByRole('button', { name: 'Submit' });
    expect(btn).toBeEnabled();
  });

  it('disables submit when selection matches saved selection', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={true}
        savedSelectionId="opt_it"
        onSubmit={onSubmit}
      />
    );
    // IT is preselected via savedSelectionId.
    const btn = screen.getByRole('button', { name: 'Submit' });
    expect(btn).toBeDisabled();
  });

  it('shows validation error when submitting with no selection', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={true}
        onSubmit={onSubmit}
      />
    );
    const form = screen.getByRole('button', { name: 'Submit' }).closest('form')!;
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent('Please select an option.');
  });

  it('calls onSubmit with the selected choice id and text', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={true}
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
        allowChange={true}
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
        allowChange={true}
        onSubmit={onSubmit}
        submitting={true}
      />
    );
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submitting...' })).toBeDisabled();
  });

  it('preselects a choice when savedSelectionId is given', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={true}
        savedSelectionId="opt_healthcare"
        onSubmit={onSubmit}
      />
    );
    const radio = screen.getByLabelText('Healthcare') as HTMLInputElement;
    expect(radio.checked).toBe(true);
  });

  it('disables unselected options when locked', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={false}
        savedSelectionId="opt_it"
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByLabelText('IT')).not.toBeDisabled();
    expect(screen.getByLabelText('Healthcare')).toBeDisabled();
    expect(screen.getByLabelText('Education')).toBeDisabled();
  });

  it('disables submit button when locked', () => {
    render(
      <SelectionForm
        questionText="Q"
        choices={mockChoices}
        allowChange={false}
        savedSelectionId="opt_it"
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
