"use client";

import { motion, type PanInfo } from "framer-motion";
import type { Place } from "@/lib/types";
import { CATEGORY_CHIP_LIGHT } from "@/lib/categories";
import { buildMapLink } from "@/lib/locationLookup";
import { ImageCarousel } from "./ImageCarousel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { spring } from "@/lib/motion";
import BasicModal from "@/components/ui/basic-modal";

type Props = {
  place: Place | null;
  onClose: () => void;
  onEdit?: (place: Place) => void;
  onDelete?: (place: Place) => void;
};

/** Detail modal — BasicModal shell + existing content and actions. */
export function LocationDetail({ place, onClose, onEdit, onDelete }: Props) {
  const isMobile = useIsMobile();

  const onDragEnd = (_: PointerEvent, info: PanInfo) => {
    if (!isMobile) return;
    if (info.offset.y > 72 || info.velocity.y > 420) onClose();
  };

  return (
    <BasicModal
      isOpen={!!place}
      onClose={onClose}
      layout={isMobile ? "bottom-sheet" : "center"}
      size="md"
      labelledBy={place ? "place-title" : undefined}
      zBackdrop={1200}
      zContainer={1300}
      drag={isMobile}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.32 }}
      onDragEnd={onDragEnd}
      sheetHandle={
        isMobile ? (
          <div className="flex justify-center pt-3 pb-0.5">
            <div className="h-1 w-10 rounded-full bg-pink-300" />
          </div>
        ) : undefined
      }
      title={
        place ? (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">
              {place.city}, {place.country}
            </p>
            <h2
              id="place-title"
              className="mt-2 text-2xl font-bold leading-[1.2] tracking-tight text-zinc-900"
            >
              {place.name}
            </h2>
          </>
        ) : undefined
      }
      panelClassName={isMobile ? "px-5 pb-8 pt-1" : "px-5 pb-8 pt-2"}
    >
      {place && (
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring.soft}
          >
            <ImageCarousel images={place.images} alt={place.name} />
          </motion.div>

          <div className="flex flex-wrap items-center gap-2">
            {place.rating != null && (
              <span className="rounded-lg border border-pink-200 bg-pink-100 px-2 py-1 text-xs font-bold tabular-nums text-rose-900">
                {place.rating.toFixed(1)} / 10
              </span>
            )}
            <span className={CATEGORY_CHIP_LIGHT[place.category]}>
              {place.category}
            </span>
          </div>

          {place.description.trim() ? (
            <p className="text-[15px] leading-relaxed text-zinc-700">
              {place.description}
            </p>
          ) : (
            <p className="text-[15px] leading-relaxed text-zinc-500 italic">
              No note added.
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            <motion.a
              href={buildMapLink({ lat: place.lat, lng: place.lng })}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              transition={spring.ui}
              className="btn-gradient inline-flex items-center justify-center rounded-xl px-4 py-3 text-base font-bold tracking-wide"
            >
              Open in Google Maps
            </motion.a>

            {onEdit && (
              <motion.button
                type="button"
                onClick={() => onEdit(place)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={spring.ui}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-base font-semibold text-zinc-900 transition-colors duration-200 hover:border-pink-300 hover:bg-pink-50/60"
              >
                Edit place
              </motion.button>
            )}

            {onDelete && (
              <motion.button
                type="button"
                onClick={() => onDelete(place)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={spring.ui}
                className="py-2 text-center text-sm font-semibold text-zinc-600 underline decoration-pink-300 underline-offset-4 transition-colors hover:text-rose-800"
              >
                Delete place
              </motion.button>
            )}
          </div>
        </div>
      )}
    </BasicModal>
  );
}
