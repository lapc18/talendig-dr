import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("defaults to type=button so it never submits a form by accident", () => {
    render(<Button>Guardar</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("can opt into submitting", () => {
    render(<Button type="submit">Guardar</Button>);

    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("calls its handler when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Guardar</Button>);

    await user.click(screen.getByRole("button"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("swaps in the loading label and announces the busy state", () => {
    render(
      <Button isLoading loadingLabel="Guardando">
        Guardar
      </Button>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Guardando");
    expect(button).not.toHaveTextContent("Guardar clase");
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("cannot be clicked while loading", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button isLoading onClick={onClick}>
        Guardar
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps the label when loading without an explicit loading label", () => {
    render(<Button isLoading>Guardar</Button>);

    expect(screen.getByRole("button")).toHaveTextContent("Guardar");
  });

  it("cannot be clicked while disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Guardar
      </Button>,
    );

    await user.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("lets a caller override the variant classes", () => {
    render(<Button className="bg-white">Guardar</Button>);

    // tailwind-merge must drop the variant's own background, not append to it.
    expect(screen.getByRole("button").className).toContain("bg-white");
    expect(screen.getByRole("button").className).not.toContain("bg-navy-900");
  });
});
