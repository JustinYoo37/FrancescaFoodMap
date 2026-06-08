"use client";

import BasicModal from "@/components/ui/basic-modal";
import { useIsMobile } from "@/hooks/useIsMobile";

const FREEMAN_APPLY =
  "https://www.iie.org/programs/freeman-asia/apply/" as const;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Francesca’s story + Freeman Asia scholarship context (culminating project).
 */
export function AboutModal({ isOpen, onClose }: Props) {
  const isMobile = useIsMobile();

  return (
    <BasicModal
      isOpen={isOpen}
      onClose={onClose}
      layout={isMobile ? "bottom-sheet" : "center"}
      size="lg"
      maxWidthClass={
        isMobile ? undefined : "max-w-[min(100vw-2rem,36rem)]"
      }
      labelledBy="about-modal-title"
      zBackdrop={1160}
      zContainer={1170}
      panelClassName="max-h-[min(88vh,720px)]"
      title={
        <h2
          id="about-modal-title"
          className="text-lg font-bold tracking-tight text-zinc-900"
        >
          About this map
        </h2>
      }
    >
      <div className="space-y-4 px-1 pb-2 text-[15px] leading-relaxed text-zinc-700 sm:px-0">
        <p>
          Hi, I&apos;m Francesca! I recently studied abroad in Shanghai and Kyoto
          and had an incredible time doing two of my favorite things: eating and
          shopping. When you come back from studying abroad, one of the most
          common questions people ask is for recommendations, so that&apos;s what
          I wanted to make this website for.
        </p>
        <p>
          This site is a collection of my favorite spots. Everything here is
          somewhere I tried and would genuinely recommend. I&apos;ve organized the
          website so it&apos;s easy to navigate and you can see my notes and pictures
          from abroad.
        </p>
        <p>
          I was able to study abroad with support from the{" "}
          <strong className="font-semibold text-zinc-900">
            Freeman Awards for Study in Asia
          </strong>
          , which supports U.S. citizens or permanent residents studying at the
          undergraduate level at a two-year or four-year college or university
          who demonstrate financial need to study abroad in East or Southeast
          Asia. If you&apos;re considering studying abroad in Asia, you should
          definitely apply:{" "}
          <a
            href={FREEMAN_APPLY}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-rose-800 underline decoration-pink-300 underline-offset-2 transition-colors hover:text-rose-950"
          >
            {FREEMAN_APPLY}
          </a>
          . The application is typically due in April, and the scholarship supports
          programs of different lengths, such as semester or quarter programs, as
          well as programs that take place at different times of year like spring
          or summer. This website is part of my culminating project for the
          scholarship.
        </p>
        <p>
          One of the reasons it&apos;s so helpful and unique is that the funds go
          directly to you, so they can be used for things like flights, visas, and
          other expenses. You can apply through the Institute of International
          Education website, and the application usually includes short essays and
          a service project component.
        </p>
        <p className="pb-1">
          If you&apos;re thinking about applying, I&apos;m happy to share more about
          my experience or answer questions!
        </p>
      </div>
    </BasicModal>
  );
}
