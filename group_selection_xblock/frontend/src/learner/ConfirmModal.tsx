/**
 * ConfirmModal — generic confirmation dialog with overlay.
 *
 * Used for all three learner confirmation flows:
 * - First submit (change allowed)
 * - Change confirmation (change allowed)
 * - Final submit (change not allowed)
 */

import React from 'react';

export interface ConfirmModalProps {
  heading: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  heading,
  body,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmModalProps): React.ReactElement {
  return (
    <div className="group-selection-modal-overlay">
      <div
        className="group-selection-modal-dialog"
        role="dialog"
        aria-modal="true"
      >
        <p className="group-selection-modal-heading">{heading}</p>
        <p className="group-selection-modal-body">{body}</p>
        <div className="group-selection-modal-actions">
          <button
            type="button"
            className="btn btn-link group-selection-cancel-btn"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-primary group-selection-modal-confirm-btn"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
