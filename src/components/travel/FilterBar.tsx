"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { PlaceCategory } from "@/lib/types";
import { ALL_CATEGORIES } from "@/lib/categories";
import { spring } from "@/lib/motion";

const COUNTRY_CHIP_MAX = 3;

const countrySelectClass =
  "min-h-[2.25rem] w-full min-w-[11rem] max-w-full cursor-pointer rounded-xl border border-zinc-200 bg-white py-2 pl-3 pr-3 text-[13px] font-semibold text-zinc-900 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-pink-300 focus:border-pink-400 focus:outline-none focus:ring-2 focus:ring-pink-200 sm:w-auto sm:max-w-[16rem] md:min-w-[12rem]";

type Props = {
  countries: string[];
  country: string | "all";
  category: PlaceCategory | "all";
  onCountry: (c: string | "all") => void;
  onCategory: (c: PlaceCategory | "all") => void;
  resultCount: number;
  /** Total saved places (for delete-all). */
  savedPlaceCount: number;
  onAddPlace?: () => void;
  onDeleteAllPlaces?: () => void;
  onAbout?: () => void;
};

const pill =
  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-tight transition-all duration-200 md:px-3 md:py-1.5 md:text-[13px]";

/**
 * Filter chrome: light panel, soft pink primary accents (solid, no gradient).
 */
export function FilterBar({
  countries,
  country,
  category,
  onCountry,
  onCategory,
  resultCount,
  savedPlaceCount,
  onAddPlace,
  onDeleteAllPlaces,
  onAbout,
}: Props) {
  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    [countries],
  );

  const useCountryDropdown = countries.length > COUNTRY_CHIP_MAX;

  const countrySelectValue =
    country === "all" || sortedCountries.includes(country) ? country : "all";

  return (
    <motion.header
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring.ui, delay: 0.04 }}
      className="pointer-events-auto w-full max-w-full"
    >
      <div className="chrome-panel-light flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center md:gap-3 md:px-4 md:py-3.5">
        <div className="flex min-w-0 shrink-0 items-center justify-between gap-3 md:max-w-[min(17rem,36vw)] md:flex-col md:items-start md:justify-center md:gap-0.5 md:pr-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1
              className="select-none text-2xl font-normal leading-none text-zinc-800 md:text-[1.75rem]"
              aria-label="Map"
            >
              ౨ৎ
            </h1>
            <span className="whitespace-nowrap text-xs tabular-nums tracking-wide text-zinc-500">
              {resultCount} places
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {onAbout && (
              <motion.button
                type="button"
                onClick={onAbout}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring.ui}
                className="text-xs font-semibold text-zinc-600 underline decoration-pink-300 underline-offset-4 transition-colors hover:text-rose-800"
              >
                About me
              </motion.button>
            )}
            {onDeleteAllPlaces && savedPlaceCount > 0 && (
              <motion.button
                type="button"
                onClick={onDeleteAllPlaces}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring.ui}
                className="text-xs font-semibold text-zinc-600 underline decoration-pink-300 underline-offset-4 transition-colors hover:text-rose-800"
              >
                Delete all
              </motion.button>
            )}
            {onAddPlace && (
              <motion.button
                type="button"
                onClick={onAddPlace}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring.ui}
                className="btn-gradient shrink-0 rounded-xl px-4 py-2 text-xs font-bold tracking-wide"
              >
                Add place
              </motion.button>
            )}
          </div>
        </div>

        <div
          className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2 md:pl-0"
          role="toolbar"
          aria-label="Filter by country and category"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {useCountryDropdown ? (
              <label className="flex w-full min-w-0 flex-col gap-1 sm:w-auto">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Country
                </span>
                <select
                  className={countrySelectClass}
                  value={countrySelectValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    onCountry(v === "all" ? "all" : v);
                  }}
                >
                  <option value="all">All countries</option>
                  {sortedCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <FilterChip
                  active={country === "all"}
                  onClick={() => onCountry("all")}
                >
                  All countries
                </FilterChip>
                {countries.map((c) => (
                  <FilterChip
                    key={c}
                    active={country === c}
                    onClick={() => onCountry(c)}
                  >
                    {c}
                  </FilterChip>
                ))}
              </>
            )}
          </div>

          <span
            className="hidden h-6 w-px shrink-0 bg-pink-200 sm:block"
            aria-hidden
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChip
              active={category === "all"}
              onClick={() => onCategory("all")}
            >
              All types
            </FilterChip>
            {ALL_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat}
                active={category === cat}
                onClick={() => onCategory(cat)}
              >
                {cat}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          {onAbout && (
            <motion.button
              type="button"
              onClick={onAbout}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.ui}
              className="text-xs font-semibold text-zinc-600 underline decoration-pink-300 underline-offset-4 transition-colors hover:text-rose-800"
            >
              About me
            </motion.button>
          )}
          {onDeleteAllPlaces && savedPlaceCount > 0 && (
            <motion.button
              type="button"
              onClick={onDeleteAllPlaces}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.ui}
              className="text-xs font-semibold text-zinc-600 underline decoration-pink-300 underline-offset-4 transition-colors hover:text-rose-800"
            >
              Delete all
            </motion.button>
          )}
          {onAddPlace && (
            <motion.button
              type="button"
              onClick={onAddPlace}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring.ui}
              className="btn-gradient rounded-xl px-4 py-2 text-xs font-bold tracking-wide"
            >
              Add place
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
}

type ChipProps = {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ children, active, onClick }: ChipProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={spring.ui}
      className={`${pill} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
        active
          ? "border border-pink-300 bg-pink-200 text-zinc-800 shadow-sm"
          : "border border-zinc-200 bg-white text-zinc-800 shadow-sm hover:border-pink-200 hover:bg-pink-50/80"
      }`}
    >
      {children}
    </motion.button>
  );
}
