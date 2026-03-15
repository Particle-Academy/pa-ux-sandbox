import { useState } from "react";
import { Composer } from "@particle-academy/react-fancy";
import { DemoSection } from "../components/DemoSection";

export function ComposerDemo() {
  const [messages, setMessages] = useState<string[]>([]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Composer</h1>

      <DemoSection title="Basic" description="Message composer with submit callback. Press Enter to send." code={`<Composer
  onSubmit={(val) => console.log(val)}
  placeholder="Type a message..."
/>`}>
        <div className="max-w-lg">
          <div className="mb-4 min-h-[100px] space-y-2 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
            {messages.length === 0 ? (
              <p className="text-sm text-zinc-400">No messages yet. Type something below.</p>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className="rounded-lg bg-white px-3 py-2 text-sm shadow-sm dark:bg-zinc-700">
                  {msg}
                </div>
              ))
            )}
          </div>
          <Composer
            onSubmit={(val) => setMessages((prev) => [...prev, val])}
            placeholder="Type a message..."
          />
        </div>
      </DemoSection>

      <DemoSection title="With Actions" description="Composer with action buttons in the toolbar." code={`<Composer
  placeholder="Write something..."
  actions={<><button>Attach</button><button>Emoji</button></>}
/>`}>
        <div className="max-w-lg">
          <Composer
            placeholder="Write something..."
            actions={
              <>
                <button type="button" className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Attach file">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <button type="button" className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Add emoji">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                </button>
              </>
            }
          />
        </div>
      </DemoSection>

      <DemoSection title="Disabled" description="Composer in read-only mode." code={`<Composer disabled placeholder="Cannot type here..." />`}>
        <div className="max-w-lg">
          <Composer disabled placeholder="Cannot type here..." />
        </div>
      </DemoSection>
    </div>
  );
}
