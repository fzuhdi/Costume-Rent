import { Modal, Button } from '@heroui/react';

/**
 * ConfirmActionModal
 *
 * A generic confirm dialog for Cancel, Delete, and Rollback actions.
 * Loading state is managed externally (passed in via prop).
 *
 * Props:
 *   isOpen        – boolean
 *   onClose       – () => void
 *   onConfirm     – async () => void   the caller handles the API call
 *   heading       – string             modal title
 *   body          – ReactNode          body content
 *   confirmLabel  – string             confirm button text
 *   confirmColor  – string             confirm button color (e.g. 'danger')
 *   loading       – bool               passed in from caller
 */
const ConfirmActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  heading = 'Konfirmasi',
  body,
  confirmLabel = 'Konfirmasi',
  confirmColor = 'danger',
  loading = false,
}) => {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onClose}>
      <Modal.Container>
        <Modal.Dialog className="bg-[var(--surface)] border border-default-200">
          <Modal.Header>
            <Modal.Heading>{heading}</Modal.Heading>
          </Modal.Header>

          <Modal.Body>{body}</Modal.Body>

          <Modal.Footer>
            <Button variant="bordered" onPress={onClose} aria-label="Kembali">
              Kembali
            </Button>
            <Button
              color={confirmColor}
              onPress={onConfirm}
              isPending={loading}
              aria-label={confirmLabel}
            >
              {confirmLabel}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};

export default ConfirmActionModal;
