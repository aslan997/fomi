"use client";

import { useWorkspace } from "./WorkspaceProvider";

const SHORTCUTS = [
  ["Generate", "Ctrl + Enter"],
  ["Previous / next generation", "[  ]"],
  ["Go to parent", "Alt + ↑"],
  ["Compare selection", "C"],
  ["Clear selection", "Esc"],
];

/** Shortcuts, demo controls and reset. Shared by the rail and the mobile menu. */
export function SettingsPanel({ close }) {
  const { nextScenario, setNextScenario, resetProject } = useWorkspace();
  return (
    <div className="w-72 space-y-4 text-[12px]">
      <section>
        <h2 className="text-[11px] font-medium tracking-wide text-ws-muted uppercase">Keyboard</h2>
        <dl className="mt-2 space-y-1.5">
          {SHORTCUTS.map(([action, keys]) => (
            <div key={action} className="flex justify-between gap-3">
              <dt className="text-ws-text-2">{action}</dt>
              <dd className="font-mono text-[11px] text-ws-text">{keys}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="border-t border-ws-line pt-3">
        <h2 className="text-[11px] font-medium tracking-wide text-ws-muted uppercase">Demo controls</h2>
        <p className="mt-1 text-ws-text-2">Generation is mocked from a local image library. Choose how the next request behaves:</p>
        <fieldset className="mt-2 flex gap-1 rounded-lg bg-ws-raised p-1">
          <legend className="sr-only">Next generation outcome</legend>
          {[
            ["success", "Success"],
            ["error", "Fail"],
            ["empty", "Empty"],
          ].map(([id, text]) => (
            <label key={id} className="flex-1">
              <input type="radio" name="ws-scenario" checked={nextScenario === id} onChange={() => setNextScenario(id)} className="peer sr-only" />
              <span className="block cursor-pointer rounded-md py-1 text-center text-ws-text-2 transition-colors peer-checked:bg-ws-overlay peer-checked:text-ws-text peer-focus-visible:outline-2 peer-focus-visible:outline-(--focus-ring)">
                {text}
              </span>
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          onClick={() => {
            resetProject();
            close?.();
          }}
          className="mt-3 text-[12px] font-medium text-ws-accent hover:underline"
        >
          Reset project to demo state
        </button>
      </section>
    </div>
  );
}
