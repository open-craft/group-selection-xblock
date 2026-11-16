/**
 * ConfirmModal — generic confirmation dialog with overlay.
 *
 * Used for all three learner confirmation flows:
 * - First submit (change allowed)
 * - Change confirmation (change allowed)
 * - Final submit (change not allowed)
 */

import React, { useId } from 'react';

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
  const headingId = useId();
  const bodyId = useId();

  return (
    <div className="group-selection-modal-overlay">
      <div
        className="group-selection-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={bodyId}
      >
        <h2 id={headingId} className="group-selection-modal-heading">{heading}</h2>
        <p id={bodyId} className="group-selection-modal-body">{body}</p>
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
