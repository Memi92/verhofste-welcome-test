"use client";

type OnScreenKeyboardProps = {
  value: string;
  onChange: (value: string) => void;
  onHide: () => void;
};

const letterRows = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z", "é", "è", "ë", "ç"],
];

export function OnScreenKeyboard({
  value,
  onChange,
  onHide,
}: OnScreenKeyboardProps) {
  function appendCharacter(character: string) {
    onChange(`${value}${character}`);
  }

  function removeLastCharacter() {
    onChange(value.slice(0, -1));
  }

  return (
    <section
      className="rounded-[8px] border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label="On-screen keyboard"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-neutral-600">
          Touch keyboard
        </p>
        <button
          type="button"
          className="min-h-11 rounded-[8px] border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px"
          onClick={onHide}
        >
          Hide keyboard
        </button>
      </div>

      <div className="space-y-2">
        {letterRows.map((row) => (
          <div
            key={row.join("")}
            className="grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-9"
          >
            {row.map((character) => (
              <button
                key={character}
                type="button"
                className="min-h-14 rounded-[8px] border border-neutral-200 bg-neutral-50 text-xl font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px active:bg-neutral-100"
                onClick={() => appendCharacter(character)}
                aria-label={`Type ${character}`}
              >
                {character}
              </button>
            ))}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <button
            type="button"
            className="min-h-14 rounded-[8px] border border-neutral-200 bg-neutral-50 px-4 text-lg font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px active:bg-neutral-100 md:col-span-2"
            onClick={() => appendCharacter(" ")}
          >
            Space
          </button>
          <button
            type="button"
            className="min-h-14 rounded-[8px] border border-neutral-200 bg-neutral-50 px-4 text-lg font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px active:bg-neutral-100"
            onClick={removeLastCharacter}
          >
            Backspace
          </button>
          <button
            type="button"
            className="min-h-14 rounded-[8px] border border-neutral-200 bg-neutral-50 px-4 text-lg font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-neutral-400 active:translate-y-px active:bg-neutral-100"
            onClick={() => onChange("")}
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}
