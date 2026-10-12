// BirthdayCelebration.jsx
//
// Mounted once in the authenticated layout. When it is the logged-in user's
// birthday (active Admin/Employee only — never a Client):
//   - every login / page reload: confetti blast from both bottom corners and a
//     "Happy Birthday" card
//   - all day: bunting, balloons and a glowing frame around the screen
// Other users see the birthday in the header banner instead (see Header.jsx).

import { useEffect, useState } from "react";
import { Cake, X } from "lucide-react";
import { useTodayBirthdays } from "../hooks/useTodayBirthdays";
import { fireCornerConfetti } from "../helpers/confetti";
import { firstName } from "../helpers/birthday";
import "./birthday.css";

const COLORS = ["#f43f5e", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#14b8a6"];
const FLAG_COUNT = 48;
const LEFT_BALLOONS = ["#f43f5e", "#facc15", "#3b82f6"];
const RIGHT_BALLOONS = ["#a855f7", "#22c55e", "#ec4899"];

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Balloons({ side, colors }) {
  return (
    <div className={`bday-balloons bday-balloons--${side}`}>
      {colors.map((color, i) => (
        <span
          key={color}
          className="bday-balloon"
          style={{ background: color, animationDelay: `${i * 0.6}s`, marginTop: i === 1 ? 0 : 14 }}
        />
      ))}
    </div>
  );
}

export default function BirthdayCelebration() {
  const { isMyBirthday, me } = useTodayBirthdays();
  const [showCard, setShowCard] = useState(false);

  // Master data loads after mount, so this fires once it turns true — i.e.
  // once per login / reload, not on every route change.
  useEffect(() => {
    if (!isMyBirthday) {
      setShowCard(false);
      return undefined;
    }
    setShowCard(true);
    if (prefersReducedMotion()) return undefined;
    return fireCornerConfetti();
  }, [isMyBirthday]);

  if (!isMyBirthday) return null;

  const name = firstName(me?.name);
  const celebrateAgain = () => {
    if (!prefersReducedMotion()) fireCornerConfetti();
  };

  return (
    <>
      <div className="bday-layer" aria-hidden="true">
        <div className="bday-frame" />
        <div className="bday-bunting">
          {Array.from({ length: FLAG_COUNT }, (_, i) => (
            <span
              key={i}
              className="bday-flag"
              style={{ background: COLORS[i % COLORS.length], animationDelay: `${(i % 6) * 0.2}s` }}
            />
          ))}
        </div>
        <Balloons side="left" colors={LEFT_BALLOONS} />
        <Balloons side="right" colors={RIGHT_BALLOONS} />
      </div>

      {showCard && (
        <div
          className="fixed inset-0 z-[990] flex items-center justify-center bg-black/30 p-4"
          onClick={() => setShowCard(false)}
        >
          <div
            role="dialog"
            aria-label="Happy birthday"
            className="bday-card relative w-[400px] max-w-full rounded-2xl border border-pink-200 bg-white px-6 pb-6 pt-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowCard(false)}
              aria-label="Close"
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
              <Cake size={34} className="text-pink-500" />
            </div>
            <h2 className="bday-title text-2xl font-bold">Happy Birthday{name ? `, ${name}` : ""}!</h2>
            <p className="mt-2 text-sm text-gray-600">
              Wishing you a wonderful year ahead, filled with joy and success. Have a fantastic day! 🎉
            </p>
            <p className="mt-1 text-xs text-gray-400">— From the whole team</p>

            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={celebrateAgain}
                className="rounded-md border border-pink-200 px-3 py-1.5 text-xs font-medium text-pink-600 hover:bg-pink-50"
              >
                Celebrate again 🎊
              </button>
              <button
                type="button"
                onClick={() => setShowCard(false)}
                className="rounded-md bg-pink-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-pink-600"
              >
                Thank you!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Small "Happy Birthday" chip for the header, shown to the birthday person all day
export function BirthdayHeaderChip() {
  const { isMyBirthday, me } = useTodayBirthdays();
  if (!isMyBirthday) return null;
  const name = firstName(me?.name);
  return (
    <div className="bday-chip inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-pink-700 whitespace-nowrap">
      <Cake size={16} className="bday-chip-icon text-pink-500" />
      Happy Birthday{name ? `, ${name}` : ""}! 🎉
    </div>
  );
}
