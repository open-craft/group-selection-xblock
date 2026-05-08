/**
 * Tests for StudioView component.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StudioView } from '../../studio/StudioView';

// Mock the api module.
jest.mock('../../common/api', () => ({
  postJson: jest.fn(),
}));

import { postJson } from '../../common/api';

const buildConfig = (overrides?: Record<string, unknown>): Record<string, unknown> => ({
  block_id: 'course-v1:TestX+TS101+2025@block-1',
  question_text: 'Which industry?',
  choices: [
    { id: 'opt_it', text: 'IT' },
  ],
  choice_group_partition_map: { opt_it: { group_id: 1, partition_id: 50 } },
  allow_change: true,
  content_groups: [
    { partition_id: 50, group_id: 1, name: 'IT Group' },
    { partition_id: 50, group_id: 2, name: 'Healthcare Group' },
  ],
  handler_urls: { studio_submit: '/studio-submit-url' },
  ...overrides,
});

describe('StudioView', () => {
  const runtime = {
    notify: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the instruction textarea with the correct value', () => {
    render(
      <StudioView initData={buildConfig()} runtime={runtime} />
    );
    const textarea = screen.getByPlaceholderText('Enter the instruction or question for learners') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Which industry?');
  });

  it('renders existing choice rows', () => {
    render(
      <StudioView initData={buildConfig()} runtime={runtime} />
    );
    const input = screen.getByDisplayValue('IT') as HTMLInputElement;
    expect(input).toBeInTheDocument();
  });

  it('renders the allow-change checkbox and reflects config', () => {
    render(
      <StudioView initData={buildConfig({ allow_change: true })} runtime={runtime} />
    );
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('renders allow-change unchecked when config is false', () => {
    render(
      <StudioView initData={buildConfig({ allow_change: false })} runtime={runtime} />
    );
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('renders the Manage content groups link when courseKey is present', () => {
    render(
      <StudioView initData={buildConfig()} runtime={runtime} />
    );
    const link = screen.getByText('Manage content groups');
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toContain('/group_configurations/');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('does not render the Manage link when block_id has no course key', () => {
    render(
      <StudioView
        initData={buildConfig({ block_id: '' })}
        runtime={runtime}
      />
    );
    expect(screen.queryByText('Manage content groups')).not.toBeInTheDocument();
  });

  it('validates that choices cannot be empty on save', async () => {
    render(
      <StudioView initData={buildConfig({ choices: [] })} runtime={runtime} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Add at least one choice.');
    });
  });

  it('validates that choice text cannot be empty on save', async () => {
    render(
      <StudioView
        initData={buildConfig({ choices: [{ id: 'a', text: '   ' }] })}
        runtime={runtime}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Choice text cannot be empty.');
    });
  });

  it('validates that each choice must have a content group', async () => {
    render(
      <StudioView
        initData={buildConfig({ choice_group_partition_map: {} })}
        runtime={runtime}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('has no content group assigned');
    });
  });

  it('calls postJson and runtime.notify on successful save', async () => {
    (postJson as jest.Mock).mockResolvedValue({ success: true });

    render(
      <StudioView initData={buildConfig()} runtime={runtime} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(postJson).toHaveBeenCalledWith('/studio-submit-url', {
        question_text: 'Which industry?',
        choices: [{ id: 'opt_it', text: 'IT' }],
        choice_group_partition_map: { opt_it: { group_id: 1, partition_id: 50 } },
        allow_change: true,
      });
      expect(runtime.notify).toHaveBeenCalledWith('save');
    });
  });

  it('shows server error when postJson returns failure', async () => {
    (postJson as jest.Mock).mockResolvedValue({ success: false, error: 'Server error.' });

    render(
      <StudioView initData={buildConfig()} runtime={runtime} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Server error.');
    });
  });

  it('shows network error when postJson throws', async () => {
    (postJson as jest.Mock).mockRejectedValue(new Error('Network'));

    render(
      <StudioView initData={buildConfig()} runtime={runtime} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('An unexpected error occurred.');
    });
  });

  it('calls runtime.notify on cancel click', () => {
    render(
      <StudioView initData={buildConfig()} runtime={runtime} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(runtime.notify).toHaveBeenCalledWith('cancel');
  });

  it('adds a new choice row when Add Choice is clicked', () => {
    render(
      <StudioView
        initData={buildConfig({ choices: [] })}
        runtime={runtime}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '+ Add Choice' }));
    // A new text input should appear.
    expect(screen.getByPlaceholderText('Choice text')).toBeInTheDocument();
  });

  it('deletes a choice when delete button is clicked', () => {
    render(
      <StudioView
        initData={buildConfig({
          choices: [
            { id: 'a', text: 'First' },
            { id: 'b', text: 'Second' },
          ],
        })}
        runtime={runtime}
      />
    );
    // Both choices should exist initially.
    expect(screen.getByDisplayValue('First')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Second')).toBeInTheDocument();

    // Click delete on the first row.
    const deleteButtons = screen.getAllByTitle('Remove choice');
    fireEvent.click(deleteButtons[0]);

    // First choice should be gone.
    expect(screen.queryByDisplayValue('First')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Second')).toBeInTheDocument();
  });
});
