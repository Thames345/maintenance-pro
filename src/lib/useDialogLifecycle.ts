import { useEffect, useRef } from 'react';

let bodyLockCount = 0;
let previousBodyOverflow = '';

/**
 * Keeps viewport dialogs usable on desktop and mobile:
 * - locks the page behind the dialog
 * - closes the active dialog with Escape
 * - reference-counts body locks so nested dialogs stay safe
 */
export function useDialogLifecycle(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    if (bodyLockCount === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    bodyLockCount += 1;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeRef.current();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      bodyLockCount = Math.max(0, bodyLockCount - 1);
      if (bodyLockCount === 0) document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);
}
