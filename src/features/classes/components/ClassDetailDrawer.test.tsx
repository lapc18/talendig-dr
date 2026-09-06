import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import { buildClassRecord } from "@/test/doubles/inMemoryClassRepository";
import { ClassDetailDrawer } from "./ClassDetailDrawer";

const RECORD = buildClassRecord({
  name: "Fundamentos de React",
  code: "DEV-101",
  date: "2026-08-28",
  teacher: "Yokasta Reyes",
  link: "https://meet.talendig.do/rec/dev-101",
  comment: "Props y estado local.",
});

/**
 * Replaces the clipboard API for a test.
 *
 * @param writeText - The implementation to install.
 */
function stubClipboard(writeText: () => Promise<void>): void {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
    writable: true,
  });
}

describe("ClassDetailDrawer", () => {
  beforeEach(() => {
    stubClipboard(() => Promise.resolve());
  });

  it("renders nothing while closed", () => {
    render(<ClassDetailDrawer record={null} onClose={vi.fn()} />);

    expect(screen.queryByText("Fundamentos de React")).not.toBeInTheDocument();
  });

  it("shows every field of the class", () => {
    render(<ClassDetailDrawer record={RECORD} onClose={vi.fn()} />);

    const panel = screen.getByRole("dialog");
    expect(within(panel).getByText("DEV-101")).toBeInTheDocument();
    expect(within(panel).getByText("Fundamentos de React")).toBeInTheDocument();
    expect(within(panel).getByText("28 de agosto de 2026")).toBeInTheDocument();
    expect(within(panel).getByText("Yokasta Reyes")).toBeInTheDocument();
    expect(within(panel).getByText("Props y estado local.")).toBeInTheDocument();
  });

  it("says so plainly when there is no comment", () => {
    render(
      <ClassDetailDrawer
        record={buildClassRecord({ comment: "" })}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(COPY.detail.noComment)).toBeInTheDocument();
  });

  it("closes from the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ClassDetailDrawer record={RECORD} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: COPY.actions.close }));

    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ClassDetailDrawer record={RECORD} onClose={onClose} />);

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalled();
  });

  it("copies the recording link and confirms it", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    render(<ClassDetailDrawer record={RECORD} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: COPY.actions.copyLink }),
    );

    expect(writeText).toHaveBeenCalledWith("https://meet.talendig.do/rec/dev-101");
    expect(
      await screen.findByRole("button", { name: COPY.actions.linkCopied }),
    ).toBeInTheDocument();
  });

  it("degrades quietly when the browser refuses clipboard access", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    stubClipboard(() => Promise.reject(new Error("denied")));
    render(<ClassDetailDrawer record={RECORD} onClose={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: COPY.actions.copyLink }),
    );

    // No confirmation, no crash: the link is visible and selectable regardless.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: COPY.actions.copyLink }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("button", { name: COPY.actions.linkCopied }),
    ).not.toBeInTheDocument();
  });

  it("opens the recording safely in a new tab", () => {
    render(<ClassDetailDrawer record={RECORD} onClose={vi.fn()} />);

    const action = screen.getByRole("link", { name: /Ver grabación/ });
    expect(action).toHaveAttribute("target", "_blank");
    expect(action).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });
});
