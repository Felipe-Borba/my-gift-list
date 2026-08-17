import { useEffect, useRef } from "react";

// Usa <dialog> nativo: focus trap, Esc e devolução de foco vêm do navegador.
function Modal({ open, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-modal="true"
      className="m-auto w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl backdrop:bg-slate-900/50 max-sm:min-h-full max-sm:max-w-full max-sm:rounded-none"
    >
      {open ? children : null}
    </dialog>
  );
}

Modal.Title = function ModalTitle({ children }) {
  return <h2 className="mb-2 text-lg font-bold text-text">{children}</h2>;
};

Modal.Description = function ModalDescription({ children }) {
  return <p className="mb-6 text-sm text-text-muted">{children}</p>;
};

Modal.Actions = function ModalActions({ children }) {
  return <div className="flex flex-wrap justify-end gap-3">{children}</div>;
};

export default Modal;
