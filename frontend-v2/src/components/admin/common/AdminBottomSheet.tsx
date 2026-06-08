import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';

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
}: {
  as?: ElementType;
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  ariaLabel?: string;
  role?: string;
  modal?: boolean;
  mountWhenClosed?: boolean;
  className?: string;
  backdropClassName?: string;
  closeLabel?: string;
}) {
  if (!open && !mountWhenClosed) return null;

  const panelProps: Record<string, string> = {
    className: `bottom-sheet-panel ${open ? 'open' : ''} ${className}`.trim(),
  };

  if (ariaLabel) panelProps['aria-label'] = ariaLabel;
  if (role) panelProps.role = role;
  if (role === 'dialog' && modal && open) panelProps['aria-modal'] = 'true';

  const sheetContent = (
    <>
      {open ? <Dialog.Overlay className={`bottom-sheet-backdrop open ${backdropClassName}`.trim()} aria-label={closeLabel} /> : null}
      <Dialog.Content asChild forceMount={mountWhenClosed || undefined}>
        <Element {...panelProps}>
          {ariaLabel ? <Dialog.Title className="visually-hidden">{ariaLabel}</Dialog.Title> : null}
          {children}
        </Element>
      </Dialog.Content>
    </>
  );

  return (
    <Dialog.Root
      open={open}
      modal={modal}
      onOpenChange={(nextOpen: boolean) => {
        if (!nextOpen && open) onClose?.();
      }}
    >
      {mountWhenClosed && !modal ? sheetContent : <Dialog.Portal>{sheetContent}</Dialog.Portal>}
    </Dialog.Root>
  );
}

export function AdminSheetHeader({
  kicker,
  title,
  closeLabel,
  onClose,
  className = 'bottom-sheet-header',
  closeButtonClassName = '',
  groupTitle = true,
}: {
  kicker?: string;
  title?: string;
  closeLabel: string;
  onClose: () => void;
  className?: string;
  closeButtonClassName?: string;
  groupTitle?: boolean;
}) {
  const titleContent = (
    <>
      {kicker ? <span className="section-kicker">{kicker}</span> : null}
      {title ? <strong>{title}</strong> : null}
    </>
  );

  return (
    <div className={className}>
      {groupTitle ? <div>{titleContent}</div> : titleContent}
      <button className={`icon-button ${closeButtonClassName}`.trim()} type="button" aria-label={closeLabel} onClick={onClose}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
