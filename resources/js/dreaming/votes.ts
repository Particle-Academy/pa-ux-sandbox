import { useCallback, useEffect, useState } from "react";

/**
 * Per-user vote on each dreamt component. Persisted in localStorage so
 * the dreaming loop has zero backend. Used by the sidebar filter and the
 * vote buttons in the DemoFrame.
 */
export type VoteState = "up" | "down" | null;

const STORAGE_KEY = "dreaming.votes.v1";
const EVENT_NAME = "dreaming-votes-changed";

function readAll(): Record<string, "up" | "down"> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, "up" | "down">): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    /* quota or privacy mode — fall through */
  }
}

export function getVote(slug: string): VoteState {
  return readAll()[slug] ?? null;
}

export function setVote(slug: string, next: VoteState): void {
  const all = readAll();
  if (next === null) {
    delete all[slug];
  } else {
    all[slug] = next;
  }
  writeAll(all);
}

export function useVote(slug: string): [VoteState, (next: VoteState) => void] {
  const [state, setState] = useState<VoteState>(() => getVote(slug));

  useEffect(() => {
    // Re-sync whenever the slug changes (route navigation keeps the same
    // DemoFrame instance) or another tab/event updates the store.
    setState(getVote(slug));
    const sync = () => setState(getVote(slug));
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);

  const update = useCallback(
    (next: VoteState) => {
      setVote(slug, next);
      setState(next);
    },
    [slug],
  );

  return [state, update];
}

export function useAllVotes(): Record<string, "up" | "down"> {
  const [all, setAll] = useState<Record<string, "up" | "down">>(() => readAll());
  useEffect(() => {
    const sync = () => setAll(readAll());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return all;
}
