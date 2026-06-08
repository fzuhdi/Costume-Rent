import { useEffect } from 'react';

export default function AdminBottomSheet({
  as: Element = 'section',
  open,
  onClose,
  children,
  ariaLabel,
  role,
  modal = true,
  mountWhenClosed = false,
  className = '',
  backdropClassName = '',
  closeLabel = 'Close',
}) {
  useEffect(() => {
    if (!open || !onClose) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open && !mountWhenClosed) return null;

  const panelProps = {
    className: `bottom-sheet-panel ${open ? 'open' : ''} ${className}`.trim(),
  };

  if (ariaLabel) panelProps['aria-label'] = ariaLabel;
  if (role) panelProps.role = role;
  if (role === 'dialog' && modal && open) panelProps['aria-modal'] = 'true';

  return (
    <>
      {open ? (
        <button
          className={`bottom-sheet-backdrop open ${backdropClassName}`.trim()}
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
        />
      ) : null}
      <Element {...panelProps}>{children}</Element>
    </>
  );
}
