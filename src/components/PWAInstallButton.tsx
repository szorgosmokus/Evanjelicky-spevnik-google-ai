import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#1A2232] text-[#FAF7F0] dark:bg-[#D4A34B] dark:text-[#111622] text-xs font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A34B]"
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>Inštalovať</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#DDD6C9] dark:border-[#2A3447] text-xs font-semibold text-[#1A2232] dark:text-[#F3EFE6] hover:bg-black/5 dark:hover:bg-white/5 transition whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4A34B]"
        >
          <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Inštalovať</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] p-6 shadow-xl">
              <div className="flex items-start justify-between gap-4">
                <h3
                  id="ios-install-title"
                  className="text-lg font-semibold text-[#1A2232] dark:text-[#F3EFE6]"
                >
                  Inštalácia pre offline použitie
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Zavrieť návod"
                  className="min-w-[40px] min-h-[40px] -mr-2 -mt-2 flex items-center justify-center rounded-lg text-[#5C6475] dark:text-[#A3AAB8] hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-2 text-sm text-[#525A6B] dark:text-[#B4BAC6] leading-relaxed">
                Pridajte si Spevník na plochu svojho zariadenia, aby ste mali všetkých 700 piesní k dispozícii v kostole aj bez internetu.
              </p>
              <ol className="mt-4 space-y-2.5 text-sm text-[#1A2232] dark:text-[#F3EFE6]">
                <li className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F3EFE6] dark:bg-[#253045] text-xs font-semibold tabular-nums">
                    1
                  </span>
                  <span className="flex items-center gap-1.5">
                    Ťuknite na tlačidlo <Share className="w-4 h-4 inline text-[#B8862D] dark:text-[#D4A34B]" aria-hidden="true" /> <strong>Zdieľať</strong> v Safari.
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F3EFE6] dark:bg-[#253045] text-xs font-semibold tabular-nums">
                    2
                  </span>
                  <span>
                    Posuňte sa nižšie a zvoľte <strong>Pridať na plochu</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#1A2232] dark:bg-[#D4A34B] text-[#FAF7F0] dark:text-[#111622] text-sm font-semibold hover:opacity-90 transition"
              >
                Hotovo
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
