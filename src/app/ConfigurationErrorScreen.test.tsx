import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import { ConfigurationErrorScreen } from "./ConfigurationErrorScreen";

describe("ConfigurationErrorScreen", () => {
  it("says the deployment is misconfigured rather than blaming the connection", () => {
    render(<ConfigurationErrorScreen missingKeys={["VITE_FIREBASE_API_KEY"]} />);

    expect(
      screen.getByText(COPY.errors.misconfiguredTitle),
    ).toBeInTheDocument();
    expect(screen.queryByText(COPY.states.errorTitle)).not.toBeInTheDocument();
  });

  it("names every missing variable so a deploy can be corrected", () => {
    render(
      <ConfigurationErrorScreen
        missingKeys={["VITE_FIREBASE_API_KEY", "VITE_FIREBASE_APP_ID"]}
      />,
    );

    expect(screen.getByText("VITE_FIREBASE_API_KEY")).toBeInTheDocument();
    expect(screen.getByText("VITE_FIREBASE_APP_ID")).toBeInTheDocument();
  });

  it("announces itself to assistive technology", () => {
    render(<ConfigurationErrorScreen missingKeys={["VITE_FIREBASE_API_KEY"]} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
