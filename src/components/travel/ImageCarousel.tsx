"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { spring } from "@/lib/motion";

type Props = {
  images: string[];
  alt: string;
};

type SlideProps = {
  src: string;
  alt: string;
  priority: boolean;
};

/** Isolated slide so `loaded` resets naturally when the image URL changes. */
function CarouselSlide({ src, alt, priority }: SlideProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={src.startsWith("data:")}
        className={`object-cover transition-opacity duration-500 ease-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes="(max-width: 768px) 100vw, 440px"
        priority={priority}
        draggable={false}
        loading={priority ? "eager" : "lazy"}
        onLoadingComplete={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      {!loaded && (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200"
          aria-hidden
        />
      )}
    </>
  );
}

/**
 * Swipeable gallery with a soft fade-in when each image finishes loading.
 */
export function ImageCarousel({ images, alt }: Props) {
  const [[page, direction], setPage] = useState([0, 0]);

  if (images.length === 0) {
    return (
      <div className="relative flex aspect-[16/10] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-center shadow-[inset_0_1px_0_rgba(0,0,0,0.03)]">
        <p className="text-sm font-semibold text-rose-800">
          No photos yet
        </p>
        <p className="max-w-[260px] px-4 text-xs leading-relaxed text-zinc-600">
          Add photos from your device when you create or edit this place.
        </p>
      </div>
    );
  }

  const safeIndex = ((page % images.length) + images.length) % images.length;
  const src = images[safeIndex];

  const paginate = (delta: number) => {
    setPage(([i]) => [i + delta, delta]);
  };

  const onDragEnd = (_: PointerEvent, info: PanInfo) => {
    const threshold = 44;
    if (info.offset.x < -threshold || info.velocity.x < -360) paginate(1);
    else if (info.offset.x > threshold || info.velocity.x > 360) paginate(-1);
  };

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 ring-1 ring-black/[0.04]">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={safeIndex}
          custom={direction}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.82}
          onDragEnd={onDragEnd}
          initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
          transition={spring.soft}
        >
          <CarouselSlide
            key={src}
            src={src}
            alt={`${alt} — photo ${safeIndex + 1}`}
            priority={safeIndex === 0}
          />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                i === safeIndex
                  ? "w-6 bg-zinc-900"
                  : "w-1.5 bg-white/85 shadow-sm ring-1 ring-black/10"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
