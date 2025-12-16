import { useEffect, useRef } from "react";
import "./dialog.css";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }

    if (!open && dialog.open) {
      dialog.close();
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  function handleClose() {
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onClick={handleBackdropClick}
      onClose={handleClose}
    >
      <div className="dialog-content">
        {title && (
          <header className="dialog-header">
            <h2>{title}</h2>
            <button
              className="dialog-close"
              aria-label="Close dialog"
              onClick={onClose}
            >
              ×
            </button>
          </header>
        )}

        <section className="dialog-body">{children}</section>

        {footer && <footer className="dialog-footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
