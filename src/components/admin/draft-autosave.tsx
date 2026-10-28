"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { saveAdminDraftAction } from "@/lib/actions/admin/drafts";
import { draftHasContent } from "@/lib/drafts";
import type { AdminDraftKind, DraftPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

const AUTOSAVE_DELAY = 1200;

export type DraftStatus = "idle" | "saving" | "saved" | "error" | "off";

export interface DraftAutosaveState {
  draftId: string;
  status: DraftStatus;
  savedAt: string | null;
  saveNow: () => Promise<void>;
}

export function serializeForm(form: HTMLFormElement): DraftPayload {
  const payload: DraftPayload = {};
  for (const element of Array.from(form.elements)) {
    if (
      !(
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      ) ||
      !element.name
    ) {
      continue;
    }
    if (element instanceof HTMLInputElement) {
      if (element.type === "file") continue;
      if (element.type === "checkbox" || element.type === "radio") {
        payload[element.name] = element.checked;
        continue;
      }
    }
    payload[element.name] = element.value;
  }
  return payload;
}

export function useDraftAutosave(
  formRef: React.RefObject<HTMLFormElement | null>,
  {
    kind,
    initialDraftId,
    enabled = true,
  }: {
    kind: AdminDraftKind;
    initialDraftId?: string | null;
    enabled?: boolean;
  },
): DraftAutosaveState {
  const [draftId, setDraftId] = useState(initialDraftId ?? "");
  const [status, setStatus] = useState<DraftStatus>(initialDraftId ? "saved" : "idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const draftIdRef = useRef(initialDraftId ?? "");
  const runningRef = useRef(false);
  const queuedRef = useRef(false);
  const offRef = useRef(false);
  const rerunRef = useRef<() => void>(() => {});

  const persist = useCallback(async () => {
    const form = formRef.current;
    if (!form || offRef.current) return;
    if (runningRef.current) {
      queuedRef.current = true;
      return;
    }

    const payload = serializeForm(form);
    if (!draftHasContent(payload)) return;

    runningRef.current = true;
    setStatus("saving");
    try {
      const result = await saveAdminDraftAction({
        kind,
        id: draftIdRef.current || null,
        payload,
      });
      if (result.ok) {
        draftIdRef.current = result.id;
        setDraftId(result.id);
        setSavedAt(result.savedAt);
        setStatus("saved");
      } else if (result.unavailable) {
        offRef.current = true;
        setStatus("off");
      } else if (result.gone) {
        draftIdRef.current = "";
        setDraftId("");
        setStatus("idle");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      runningRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        rerunRef.current();
      }
    }
  }, [formRef, kind]);

  useEffect(() => {
    rerunRef.current = () => {
      void persist();
    };
  }, [persist]);

  useEffect(() => {
    const form = formRef.current;
    if (!form || !enabled) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const cancel = () => {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
    };
    const save = () => {
      cancel();
      void persist();
    };
    const schedule = () => {
      cancel();
      timer = setTimeout(save, AUTOSAVE_DELAY);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    // The final save deletes the draft, so a queued autosave must not fire
    // after it. Any save already in flight finishes harmlessly on the server.
    const onSubmit = () => {
      cancel();
    };

    form.addEventListener("input", schedule);
    form.addEventListener("change", schedule);
    form.addEventListener("submit", onSubmit);
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      form.removeEventListener("input", schedule);
      form.removeEventListener("change", schedule);
      form.removeEventListener("submit", onSubmit);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) {
        clearTimeout(timer);
        void persist();
      }
    };
  }, [formRef, enabled, persist]);

  return {
    draftId,
    status,
    savedAt,
    saveNow: persist,
  };
}

export function DraftStatusBar({
  draft,
  className,
}: {
  draft: DraftAutosaveState;
  className?: string;
}) {
  if (draft.status === "off") return null;

  const message =
    draft.status === "saving"
      ? "Saving draft…"
      : draft.status === "error"
        ? "Draft not saved. Retry before leaving."
        : draft.status === "saved"
          ? draft.savedAt
            ? `Draft saved at ${new Date(draft.savedAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "Draft loaded. Changes save automatically."
          : "Unfinished work is kept as a draft automatically.";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border border-line bg-paper/70 px-3 py-2 text-[0.62rem] leading-relaxed",
        className,
      )}
    >
      <span className="flex items-center gap-1.5 text-muted">
        {draft.status === "saving" ? (
          <Loader2 className="size-3 animate-spin text-clay-deep" aria-hidden />
        ) : (
          <span
            className={cn(
              "size-1.5 rounded-full",
              draft.status === "error" ? "bg-red-700" : "bg-sage",
            )}
            aria-hidden
          />
        )}
        <span className={draft.status === "error" ? "text-red-900" : undefined}>
          {message}
        </span>
      </span>
      {draft.status === "saving" ? null : (
        <button
          type="button"
          onClick={() => void draft.saveNow()}
          className="font-semibold uppercase tracking-[0.12em] text-clay-deep transition-colors hover:text-ink"
        >
          Save draft
        </button>
      )}
    </div>
  );
}
