import React from 'react';
import { Bell, BellOff, Check, Smartphone, VolumeX, X, Vibrate } from 'lucide-react';

interface ChurchSilenceModalProps {
  isOpen: boolean;
  isSilentActive: boolean;
  onClose: () => void;
  onToggleSilent: () => void;
}

export const ChurchSilenceModal: React.FC<ChurchSilenceModalProps> = ({
  isOpen,
  isSilentActive,
  onClose,
  onToggleSilent,
}) => {
  if (!isOpen) return null;

  const testVibration = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 50, 80]);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="silence-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#F8F6F1] dark:bg-[#1A2232] border border-[#E7E2D8] dark:border-[#2A3447] shadow-2xl p-5 sm:p-6 text-[#1A2232] dark:text-[#F3EFE6] relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Zavrieť okno"
          className="absolute top-4 right-4 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#1A2232] dark:hover:text-[#F3EFE6] hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isSilentActive
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-[#B8862D]/15 text-[#B8862D] dark:text-[#E0AE4E]'
            }`}
          >
            {isSilentActive ? (
              <BellOff className="w-6 h-6" aria-hidden="true" />
            ) : (
              <Bell className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <div>
            <h2 id="silence-modal-title" className="text-lg font-bold font-hymnal tracking-tight">
              Tichý režim v chráme
            </h2>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Dôstojnosť a ticho počas služieb Božích
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-[#525A6B] dark:text-[#C5CCD8] leading-relaxed">
          Pred začiatkom bohoslužieb alebo modlitieb si prosím prepnite telefón do tichého režimu,
          aby ste nerušili prítomných bratov a sestry.
        </p>

        {/* Device Guide Cards */}
        <div className="mt-4 space-y-2.5">
          <div className="rounded-xl bg-white dark:bg-[#111622] border border-[#E7E2D8] dark:border-[#242D3F] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#1A2232] dark:text-[#FAF7F0] mb-1">
              <Smartphone className="w-3.5 h-3.5 text-[#B8862D] dark:text-[#D4A34B]" />
              <span>Android</span>
            </div>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] leading-normal">
              Stlačte bočné tlačidlo hlasitosti a ťuknite na ikonu zvončeka pre <strong>Tichý režim</strong> alebo stiahnite hornú lištu a zapnite <strong>Nerušiť</strong>.
            </p>
          </div>

          <div className="rounded-xl bg-white dark:bg-[#111622] border border-[#E7E2D8] dark:border-[#242D3F] p-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[#1A2232] dark:text-[#FAF7F0] mb-1">
              <Smartphone className="w-3.5 h-3.5 text-[#B8862D] dark:text-[#D4A34B]" />
              <span>iPhone / Apple</span>
            </div>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] leading-normal">
              Prepnite prepínač na ľavom boku telefónu do tichej polohy (oranžový pásik) alebo zapnite <strong>Režim Nerušiť</strong> v ovládacom centre.
            </p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="mt-5 pt-4 border-t border-[#EAE4D7] dark:border-[#253045] flex flex-col gap-2.5">
          {/* Test vibration button */}
          <button
            type="button"
            onClick={testVibration}
            className="w-full min-h-[40px] px-3 rounded-xl bg-white dark:bg-[#111622] border border-[#E7E2D8] dark:border-[#2A3447] text-xs font-semibold text-[#1A2232] dark:text-[#F3EFE6] hover:bg-[#EFECE4] dark:hover:bg-[#20293B] flex items-center justify-center gap-2 transition"
          >
            <Vibrate className="w-4 h-4 text-[#8C6D32] dark:text-[#D4A34B]" />
            <span>Otestovať vibráciu telefónu</span>
          </button>

          {/* Toggle silent status badge */}
          <button
            type="button"
            onClick={() => {
              onToggleSilent();
              testVibration();
            }}
            className={`w-full min-h-[46px] px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
              isSilentActive
                ? 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700'
                : 'bg-[#1A2232] text-[#FAF7F0] dark:bg-[#D4A34B] dark:text-[#111622] hover:opacity-90'
            }`}
          >
            {isSilentActive ? (
              <>
                <Check className="w-4 h-4" />
                <span>Telefón je stíšený (Tichý režim aktívny)</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Zapnúť tichý režim v aplikácii</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
