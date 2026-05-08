/**
 * Tests for LearnerView — state machine transitions including modal flows.
 *
 * Learner flow with modals:
 * - allow_change=true, no selection:
 *   Form → Submit click → Modal 1 ("first_submit") → Continue → POST → Confirmation
 * - allow_change=true, has selection:
 *   Confirmation → Change selection → Form → Submit click → Modal 2 ("change_confirm") → Change → POST → Confirmation
 * - allow_change=false, no selection:
 *   Form → Submit click → Modal 3 ("final_submit") → Submit → POST → Locked
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
  });

  it('renders SelectionConfirmation when selection exists and allow_change=true', () => {
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
    expect(screen.getByRole('button', { name: 'Change selection' })).toBeInTheDocument();
  });

  it('renders SelectionLocked when selection exists and allow_change=false', () => {
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
    expect(screen.getByText('Healthcare')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Change selection' })
    ).not.toBeInTheDocument();
  });

  // --- Change selection flow (no POST involved) ---

  it('transitions from confirmation to form on "Change selection" click', () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));

    // Should now see the selection form with Cancel button.
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('transitions back to confirmation on Cancel click from change mode', () => {
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

    // Go to change mode.
    fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    // Click Cancel.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Should be back to confirmation.
    expect(screen.getByRole('button', { name: 'Change selection' })).toBeInTheDocument();
  });

  // --- Modal 1: first_submit (allow_change=true) ---

  it('shows Modal 1 on first submit when allow_change=true', () => {
    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: true })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    // Modal 1 should appear.
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

    // Modal is shown.
    expect(screen.getByText('You can change your selection later')).toBeInTheDocument();

    // Click Cancel in the modal.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    // Modal should be gone, form should still be visible.
    expect(screen.queryByText('You can change your selection later')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('completes first_submit flow: Continue → POST → transitions to confirmation', async () => {
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

    // Modal 1 is up — click Continue.
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith('/submit-url', { choice_id: 'opt_it' });
      expect(screen.getByRole('button', { name: 'Change selection' })).toBeInTheDocument();
    });
  });

  // --- Modal 3: final_submit (allow_change=false) ---

  it('shows Modal 3 on submit when allow_change=false', () => {
    render(
      <LearnerView initData={buildConfig({ selection: null, allow_change: false })} />
    );

    fireEvent.click(screen.getByLabelText('IT'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    // Modal 3 should appear.
    expect(screen.getByText('Submit your choice?')).toBeInTheDocument();
    expect(screen.getByText("Once you click submit, you won't be able to change your selection.")).toBeInTheDocument();

    // Both form and modal have a Submit button; scope to dialog.
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

    // Click Cancel in modal.
    const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' });
    // Modal Cancel is the one inside the overlay.
    fireEvent.click(cancelButtons[0]);

    // Modal gone, form still there.
    expect(screen.queryByText('Submit your choice?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('completes final_submit flow: Submit → POST → transitions to locked', async () => {
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

    // Modal 3 is up — click Submit in modal.
    const submitButtons = screen.getAllByRole('button', { name: 'Submit' });
    fireEvent.click(submitButtons[1]); // modal's Submit button

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith('/submit-url', { choice_id: 'opt_it' });
      expect(screen.getByText('IT')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Change selection' })).not.toBeInTheDocument();
    });
  });

  // --- Modal 2: change_confirm (changing state) ---

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

    // Go to change mode.
    fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    // Select a different choice.
    fireEvent.click(screen.getByLabelText('Healthcare'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    // Modal 2 should appear.
    expect(screen.getByText('Change your selection?')).toBeInTheDocument();
    expect(
      screen.getByText('Any work completed in your previous option, will be saved. Switching back will restore your previous progress.')
    ).toBeInTheDocument();

    // Scope to dialog — form also has Cancel/Submit buttons in change mode.
    const dialog2 = screen.getByRole('dialog');
    expect(within(dialog2).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(within(dialog2).getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('dismisses Modal 2 on Cancel and returns to confirmation with original selection', async () => {
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

    // Go to change mode.
    fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    // Select different choice.
    fireEvent.click(screen.getByLabelText('Healthcare'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Change your selection?')).toBeInTheDocument();

    // Click Cancel in the modal (scoped to dialog — form also has a Cancel button).
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    // Back to confirmation with original selection (IT).
    await waitFor(() => {
      expect(screen.queryByText('Change your selection?')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Change selection' })).toBeInTheDocument();
  });

  it('completes change_confirm flow: Change → POST → confirmation with new selection', async () => {
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

    fireEvent.click(screen.getByRole('button', { name: 'Change selection' }));
    fireEvent.click(screen.getByLabelText('Healthcare'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    // Click Change in modal.
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith('/submit-url', { choice_id: 'opt_healthcare' });
      expect(screen.getByRole('button', { name: 'Change selection' })).toBeInTheDocument();
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

    // Click Continue in modal.
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
