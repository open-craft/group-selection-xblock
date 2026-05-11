/**
 * Tests for LearnerView — modal flows with persistent SelectionForm.
 *
 * Learner flow:
 * - allow_change=true, no selection:
 *   Form → Submit → Modal 1 ("first_submit") → Continue → POST → Form with selection
 * - allow_change=true, has selection:
 *   Form (preselected) → pick different → Submit → Modal 2 ("change_confirm") → Change → POST → Form updated
 * - allow_change=false, no selection:
 *   Form → Submit → Modal 3 ("final_submit") → Submit → POST → Form locked
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LearnerView } from '../../learner/LearnerView';

// Mock the api module to prevent actual fetch calls.
jest.mock('../../common/api', () => ({
  postJson: jest.fn(),
}));

import { postJson } from '../../common/api';

const buildConfig = (overrides?: Record<string, unknown>): Record<string, unknown> => ({
  block_id: 'block-1',
  question_text: 'Which industry?',
  choices: [
    { id: 'opt_it', text: 'IT' },
    { id: 'opt_healthcare', text: 'Healthcare' },
  ],
  selection: null,
  allow_change: true,
  handler_urls: { submit_selection: '/submit-url' },
  ...overrides,
});

describe('LearnerView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Initial render states ---

  it('renders SelectionForm when there is no selection', () => {
    render(
      <LearnerView initData={buildConfig({ selection: null })} />
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByText('Choose one:')).toBeInTheDocument();
  });

  it('renders SelectionForm with preselected choice when selection exists and allow_change=true', () => {
    render(
      <LearnerView
        initData={buildConfig({
          selection: {
            choice_id: 'opt_it',
            content_group_id: 1,
            cohort_id: 10,
            created: '2025-01-15T10:00:00',
            modified: '2025-01-15T10:00:00',
            can_change: true,
          },
          allow_change: true,
        })}
      />
    );
    const radio = screen.getByLabelText('IT') as HTMLInputElement;
    expect(radio.checked).toBe(true);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('renders SelectionForm with disabled options when selection exists and allow_change=false', () => {
    render(
      <LearnerView
        initData={buildConfig({
          selection: {
            choice_id: 'opt_healthcare',
            content_group_id: 2,
            cohort_id: 11,
            created: '2025-01-15T10:00:00',
            modified: '2025-01-15T10:00:00',
            can_change: false,
          },
          allow_change: false,
        })}
      />
    );
    expect(screen.getByLabelText('Healthcare')).not.toBeDisabled();
    expect(screen.getByLabelText('IT')).toBeDisabled();
    expect(screen.getByText('Once submitted, your choice cannot be changed.')).toBeInTheDocument();
  });

  // --- Modal 1: first_submit (allow_change=true) ---

  it('shows Modal 1 on first submit when allow_change=true', () => {
    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: true })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('You can change your selection later')).toBeInTheDocument();
    expect(screen.getByText('Come back to this page to change your selection at any time.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('dismisses Modal 1 on Cancel and returns to form', () => {
    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: true })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('You can change your selection later')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('You can change your selection later')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('completes first_submit flow: Continue → POST → form shows selection', async () => {
    (postJson as jest.Mock).mockResolvedValue({
      success: true,
      choice_id: 'opt_it',
      choice_text: 'IT',
    });

    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: true })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith('/submit-url', { choice_id: 'opt_it' });
      const radio = screen.getByLabelText('IT') as HTMLInputElement;
      expect(radio.checked).toBe(true);
    });
  });

  // --- Modal 3: final_submit (allow_change=false) ---

  it('shows Modal 3 on submit when allow_change=false', () => {
    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: false })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Submit your choice?')).toBeInTheDocument();
    expect(screen.getByText("Once you click submit, you won't be able to change your selection.")).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('dismisses Modal 3 on Cancel and stays on form', () => {
    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: false })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Submit your choice?')).toBeInTheDocument();

    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButtons[0]);

    expect(screen.queryByText('Submit your choice?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('completes final_submit flow: Submit → POST → form locked', async () => {
    (postJson as jest.Mock).mockResolvedValue({
      success: true,
      choice_id: 'opt_it',
      choice_text: 'IT',
    });

    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: false })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    const submitButtons = screen.getAllByRole('button', { name: 'Submit' });
    fireEvent.click(submitButtons[1]);

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith('/submit-url', { choice_id: 'opt_it' });
      expect(screen.getByLabelText('IT')).not.toBeDisabled();
      expect(screen.getByLabelText('Healthcare')).toBeDisabled();
    });
  });

  // --- Modal 2: change_confirm (has selection, allow_change=true) ---

  it('shows Modal 2 on submit when changing selection', () => {
    render(
      <LearnerView
        initData={buildConfig({
          selection: {
            choice_id: 'opt_it',
            content_group_id: 1,
            cohort_id: 10,
            created: '2025-01-15T10:00:00',
            modified: '2025-01-15T10:00:00',
            can_change: true,
          },
          allow_change: true,
        })}
      />
    );

    // Pick a different choice and submit.
    fireEvent.click(screen.getByLabelText('Healthcare'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Change your selection?')).toBeInTheDocument();
    expect(
      screen.getByText('Any work completed in your previous option, will be saved. Switching back will restore your previous progress.')
    ).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('dismisses Modal 2 on Cancel and returns to form', async () => {
    render(
      <LearnerView
        initData={buildConfig({
          selection: {
            choice_id: 'opt_it',
            content_group_id: 1,
            cohort_id: 10,
            created: '2025-01-15T10:00:00',
            modified: '2025-01-15T10:00:00',
            can_change: true,
          },
          allow_change: true,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('Healthcare'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Change your selection?')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByText('Change your selection?')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('completes change_confirm flow: Change → POST → form updated', async () => {
    (postJson as jest.Mock).mockResolvedValue({
      success: true,
      choice_id: 'opt_healthcare',
      choice_text: 'Healthcare',
    });

    render(
      <LearnerView
        initData={buildConfig({
          selection: {
            choice_id: 'opt_it',
            content_group_id: 1,
            cohort_id: 10,
            created: '2025-01-15T10:00:00',
            modified: '2025-01-15T10:00:00',
            can_change: true,
          },
          allow_change: true,
        })}
      />
    );

    fireEvent.click(screen.getByLabelText('Healthcare'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith('/submit-url', { choice_id: 'opt_healthcare' });
      const radio = screen.getByLabelText('Healthcare') as HTMLInputElement;
      expect(radio.checked).toBe(true);
    });
  });

  // --- Error handling ---

  it('displays submit error when POST fails', async () => {
    (postJson as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Server error occurred.',
    });

    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: true })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error occurred.');
    });
  });

  it('displays generic error on network failure', async () => {
    (postJson as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: true })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('An unexpected error occurred.');
    });
  });
});
