/**
 * Tests for ConfirmModal — reusable confirmation dialog.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from '../../learner/ConfirmModal';

describe('ConfirmModal', () => {
  const onCancel = jest.fn();
  const onConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the heading', () => {
    render(
      <ConfirmModal
        heading="Test Heading"
        body="Test body."
        cancelLabel="Cancel"
        confirmLabel="OK"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    expect(screen.getByRole('heading', { name: 'Test Heading' })).toBeInTheDocument();
  });

  it('renders the body text', () => {
    render(
      <ConfirmModal
        heading="H"
        body="This is the modal body."
        cancelLabel="Cancel"
        confirmLabel="OK"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    expect(screen.getByText('This is the modal body.')).toBeInTheDocument();
  });

  it('renders cancel and confirm buttons with correct labels', () => {
    render(
      <ConfirmModal
        heading="H"
        body="B"
        cancelLabel="Go Back"
        confirmLabel="Proceed"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proceed' })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <ConfirmModal
        heading="H"
        body="B"
        cancelLabel="Cancel"
        confirmLabel="OK"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <ConfirmModal
        heading="H"
        body="B"
        cancelLabel="Cancel"
        confirmLabel="OK"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('has correct accessibility attributes', () => {
    render(
      <ConfirmModal
        heading="H"
        body="B"
        cancelLabel="Cancel"
        confirmLabel="OK"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});
