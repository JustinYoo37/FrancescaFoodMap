"use client";

import { motion } from "framer-motion";
import { fade } from "@/lib/motion";

/** Map load veil — light surface to match Positron basemap. */
export function MapSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { ...fade.in, duration: 0.32 } }}
      className="absolute inset-0 z-[1] bg-zinc-100"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200 opacity-90" />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="rounded-xl border border-zinc-300/80 bg-white/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600 shadow-sm">
          Loading map
        </p>
      </div>
    </motion.div>
  );
}
