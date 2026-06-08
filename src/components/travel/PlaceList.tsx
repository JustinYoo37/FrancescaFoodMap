"use client";

import { motion } from "framer-motion";
import type { Place } from "@/lib/types";
import { CATEGORY_CHIP_LIGHT } from "@/lib/categories";
import { spring } from "@/lib/motion";

type Props = {
  places: Place[];
  selectedId: number | null;
  onSelect: (place: Place) => void;
};

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 6 },
  show: {
    opacity: 1,
    y: 0,
    transition: spring.soft,
  },
};

/** Desktop list — glass rail with luminous cards (web3 chrome). */
export function PlaceList({ places, selectedId, onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring.soft, delay: 0.08 }}
      className="chrome-panel-light pointer-events-auto hidden max-h-[min(640px,calc(100vh-7rem))] w-full max-w-[22rem] flex-col overflow-hidden md:flex"
    >
      <div className="border-b border-zinc-200 px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-700">
          Saved places
        </p>
        <p className="mt-1.5 text-sm leading-snug text-zinc-500">
          Tap a card — the map moves with you.
        </p>
      </div>
      <motion.ul
        key={places.map((p) => p.id).join("-")}
        className="flex-1 space-y-2 overflow-y-auto px-3 pb-4 pt-3"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {places.length === 0 && (
          <li className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/70 px-3 py-8 text-center">
            <p className="text-sm font-semibold text-zinc-800">No places yet</p>
            <p className="mt-2 text-xs leading-relaxed text-zinc-600">
              Use{" "}
              <span className="font-semibold text-rose-800">Add place</span>{" "}
              above. Everything stays in this browser.
            </p>
          </li>
        )}
        {places.map((place) => {
          const active = place.id === selectedId;
          const chipClass = CATEGORY_CHIP_LIGHT[place.category];
          return (
            <motion.li key={place.id} variants={rowVariants} layout>
              <motion.button
                type="button"
                layout
                onClick={() => onSelect(place)}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                transition={spring.ui}
                className={`flex w-full flex-col gap-1.5 rounded-2xl border px-3 py-2.5 text-left transition-all duration-200 ${
                  active
                    ? "border-pink-200 bg-pink-50 shadow-md ring-1 ring-pink-100"
                    : "border-zinc-200 bg-white shadow-sm hover:border-pink-200 hover:bg-pink-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-zinc-900">
                    {place.name}
                  </p>
                  {place.rating != null ? (
                    <span className="shrink-0 text-xs font-bold tabular-nums text-rose-700">
                      {place.rating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-400">
                      —
                    </span>
                  )}
                </div>
                <p className="text-xs leading-relaxed text-zinc-600">
                  {place.city} · {place.country}
                </p>
                <span className={`mt-0.5 inline-flex w-fit ${chipClass}`}>
                  {place.category}
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </motion.ul>
    </motion.div>
  );
}
