import { memo } from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmModal = memo(function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading  = false,
  title    = 'Confirm Delete',
  message  = 'Are you sure you want to delete this record? This action cannot be undone.',
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-base text-neutral-muted">{message}</p>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
});

export default ConfirmModal;
