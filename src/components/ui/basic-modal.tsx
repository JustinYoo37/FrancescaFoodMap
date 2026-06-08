"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";

import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { spring } from "@/lib/motion";

const modalSizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
} as const;

export type BasicModalSize = keyof typeof modalSizes;

export type BasicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  size?: BasicModalSize;
  /** Overrides `size` width when set (e.g. `max-w-[min(100vw-2rem,440px)]`). */
  maxWidthClass?: string;
  /** Centered card (reference) or bottom sheet (mobile). */
  layout?: "center" | "bottom-sheet";
  /** Extra classes on the panel (e.g. max height, sheet radius). */
  panelClassName?: string;
  /** Shown above sheet content when `layout="bottom-sheet"` (e.g. drag handle). */
  sheetHandle?: ReactNode;
  drag?: boolean;
  dragConstraints?: { top: number; bottom: number };
  dragElastic?: number | { top: number; bottom: number };
  onDragEnd?: (e: PointerEvent, info: PanInfo) => void;
  /** `aria-labelledby` — use when `title` is custom markup with its own heading id. */
  labelledBy?: string;
  /** Backdrop / stack — stay above map chrome. */
  zBackdrop?: number;
  zContainer?: number;
};

const backdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

const sheetHidden = { y: "104%" };
const sheetShow = { y: 0, transition: spring.sheet };
const sheetExit = {
  y: "104%",
  transition: { type: "spring" as const, stiffness: 440, damping: 40 },
};

/**
 * Light modal shell: soft dim backdrop, white panel, spring motion, outside click,
 * Escape, body scroll lock, Lucide close control.
 */
export default function BasicModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  maxWidthClass,
  layout = "center",
  panelClassName = "",
  sheetHandle,
  drag = false,
  dragConstraints = { top: 0, bottom: 0 },
  dragElastic = { top: 0, bottom: 0.32 },
  onDragEnd,
  labelledBy,
  zBackdrop = 1240,
  zContainer = 1250,
}: BasicModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(modalRef, () => {
    if (isOpen) onClose();
  }, isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isSheet = layout === "bottom-sheet";

  const panelBase =
    "relative mx-auto w-full border border-zinc-200/90 bg-white p-4 text-zinc-900 shadow-xl shadow-zinc-900/10 ring-1 ring-black/[0.04] sm:p-6";

  const widthClass = maxWidthClass ?? modalSizes[size];

  const panelLayout = isSheet
    ? `rounded-t-3xl rounded-b-none ${panelClassName || "max-h-[min(92vh,860px)]"}`
    : `${widthClass} rounded-2xl ${panelClassName}`;

  const ariaLabelledBy =
    labelledBy ??
    (typeof title === "string" ? "basic-modal-title" : undefined);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            ref={overlayRef}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-sm"
            style={{ zIndex: zBackdrop }}
            initial={backdropMotion.initial}
            animate={backdropMotion.animate}
            exit={backdropMotion.exit}
            transition={backdropMotion.transition}
            onClick={(e) => {
              if (e.target === overlayRef.current) onClose();
            }}
          />

          {isSheet ? (
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={ariaLabelledBy}
              className={`${panelBase} ${panelLayout} fixed inset-x-0 bottom-0 flex max-h-[inherit] flex-col overflow-hidden`}
              style={{ zIndex: zContainer }}
              initial={sheetHidden}
              animate={sheetShow}
              exit={sheetExit}
              drag={drag ? "y" : false}
              dragConstraints={dragConstraints}
              dragElastic={dragElastic}
              onDragEnd={onDragEnd}
            >
              {sheetHandle}
              <ModalHeader title={title} onClose={onClose} />
              <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto">
                {children}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="fixed inset-0 flex items-center justify-center overflow-y-auto px-4 py-6 sm:p-8"
              style={{ zIndex: zContainer }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={ariaLabelledBy}
                className={`${panelBase} ${panelLayout} flex min-h-0 flex-col overflow-hidden`}
                initial={{ scale: 0.96, y: 16, opacity: 0 }}
                animate={{
                  scale: 1,
                  y: 0,
                  opacity: 1,
                  transition: { type: "spring", damping: 24, stiffness: 300 },
                }}
                exit={{
                  scale: 0.98,
                  y: 8,
                  opacity: 0,
                  transition: { duration: 0.15 },
                }}
              >
                <ModalHeader title={title} onClose={onClose} />
                <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {children}
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function ModalHeader({
  title,
  onClose,
}: {
  title?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="mb-4 flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 pb-4">
      {title ? (
        <div className="min-w-0 flex-1 pr-2">
          {typeof title === "string" ? (
            <h3
              id="basic-modal-title"
              className="text-xl font-semibold leading-6 tracking-tight text-zinc-900"
            >
              {title}
            </h3>
          ) : (
            title
          )}
        </div>
      ) : (
        <span className="flex-1" />
      )}
      <motion.button
        type="button"
        className="ml-auto shrink-0 rounded-full p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-300/80"
        onClick={onClose}
        whileHover={{ rotate: 90 }}
        transition={{ duration: 0.2 }}
        aria-label="Close"
      >
        <X className="h-5 w-5" aria-hidden />
      </motion.button>
    </div>
  );
}
