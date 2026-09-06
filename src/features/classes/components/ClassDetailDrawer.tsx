/**
 * Full detail of one class, in a side panel over the results.
 */

import { useState } from "react";
import { Badge } from "@/shared/components/ui/Badge";
import { Button } from "@/shared/components/ui/Button";
import { Drawer } from "@/shared/components/ui/Drawer";
import { COPY } from "@/shared/i18n/copy";
import { logger } from "@/shared/lib/logger";
import { formatLongDate } from "@/shared/utils/date";
import type { ClassRecord } from "../types";
import { RecordingLink } from "./RecordingLink";

/** Props for {@link ClassDetailDrawer}. */
export interface ClassDetailDrawerProps {
  /** The class to show, or `null` when the panel is closed. */
  readonly record: ClassRecord | null;
  readonly onClose: () => void;
}

/** Caption style shared by the panel's field labels. */
const LABEL_CLASSES =
  "mb-1.5 block font-sans text-caption font-semibold text-ink-600 uppercase";

/**
 * Renders the class detail panel.
 *
 * @param props - The class to show and the close handler.
 * @returns The drawer element.
 */
export function ClassDetailDrawer({
  record,
  onClose,
}: ClassDetailDrawerProps) {
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  /** Copies the recording URL, degrading quietly where the API is blocked. */
  async function copyLink(): Promise<void> {
    if (record === null) return;

    try {
      await navigator.clipboard.writeText(record.link);
      setHasCopiedLink(true);
      window.setTimeout(() => {
        setHasCopiedLink(false);
      }, 2000);
    } catch (error) {
      // Clipboard access is denied in some browsers and insecure contexts. The
      // link is visible and selectable either way, so this is not worth an
      // error state.
      logger.warn("Clipboard write was refused", { error });
    }
  }

  return (
    <Drawer
      isOpen={record !== null}
      onClose={() => {
        setHasCopiedLink(false);
        onClose();
      }}
      title={record?.name ?? COPY.detail.comment}
      header={
        record === null ? null : (
          <div>
            <Badge tone="neutral" className="mb-2.5">
              {record.code}
            </Badge>
            <h2 className="font-sans text-h2 font-extrabold text-navy-900">
              {record.name}
            </h2>
          </div>
        )
      }
      footer={
        record === null ? undefined : (
          <>
            <RecordingLink
              href={record.link}
              classCode={record.code}
              surface="detail"
              emphasis="solid"
              className="flex-1 rounded-control py-3.5 text-sm"
            />
            <Button
              variant="outline"
              onClick={() => {
                void copyLink();
              }}
            >
              {hasCopiedLink ? COPY.actions.linkCopied : COPY.actions.copyLink}
            </Button>
          </>
        )
      }
    >
      {record !== null && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <span className={LABEL_CLASSES}>{COPY.detail.date}</span>
              <p className="font-sans text-[15px] leading-[1.4] font-semibold text-navy-900">
                {formatLongDate(record.date)}
              </p>
            </div>
            <div>
              <span className={LABEL_CLASSES}>{COPY.detail.teacher}</span>
              <p className="font-sans text-[15px] leading-[1.4] font-semibold text-navy-900">
                {record.teacher}
              </p>
            </div>
          </div>

          <div>
            <span className={LABEL_CLASSES}>{COPY.detail.link}</span>
            <a
              href={record.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm leading-[1.4] font-medium break-all"
            >
              {record.link}
            </a>
          </div>

          <div>
            <span className={LABEL_CLASSES}>{COPY.detail.comment}</span>
            <p className="rounded-control bg-navy-50 p-4 font-sans text-[14.5px] leading-[1.65] text-ink-700">
              {record.comment === "" ? COPY.detail.noComment : record.comment}
            </p>
          </div>
        </>
      )}
    </Drawer>
  );
}
