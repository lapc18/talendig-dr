import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { COPY } from "@/shared/i18n/copy";
import { FakeAuthService, TEST_USER } from "@/test/doubles/fakeAuthService";
import { renderWithProviders } from "@/test/renderWithProviders";
import { LoginPage } from "./LoginPage";

describe("LoginPage", () => {
  it("asks for a username before submitting anything", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { authService: new FakeAuthService() });

    await user.click(screen.getByRole("button", { name: COPY.actions.signIn }));

    expect(
      await screen.findByText(COPY.validation.usernameRequired),
    ).toBeInTheDocument();
  });

  it("asks for a password once a username is present", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { authService: new FakeAuthService() });

    await user.type(screen.getByLabelText(/Usuario/), "yokasta.reyes");
    await user.click(screen.getByRole("button", { name: COPY.actions.signIn }));

    expect(
      await screen.findByText(COPY.validation.passwordRequired),
    ).toBeInTheDocument();
  });

  it("shows the rejection and clears the password after bad credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { authService: new FakeAuthService() });

    await user.type(screen.getByLabelText(/Usuario/), "yokasta.reyes");
    await user.type(screen.getByLabelText(/Contraseña/), "incorrecta");
    await user.click(screen.getByRole("button", { name: COPY.actions.signIn }));

    expect(
      await screen.findByText(COPY.errors.invalidCredentials),
    ).toBeInTheDocument();
    // A rejected password must not stay in the field.
    expect(screen.getByLabelText(/Contraseña/)).toHaveValue("");
  });

  it("announces the failure through an alert", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { authService: new FakeAuthService() });

    await user.type(screen.getByLabelText(/Usuario/), "yokasta.reyes");
    await user.type(screen.getByLabelText(/Contraseña/), "incorrecta");
    await user.click(screen.getByRole("button", { name: COPY.actions.signIn }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      COPY.errors.invalidCredentials,
    );
  });

  it("keeps the password hidden until the reader asks to see it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { authService: new FakeAuthService() });

    const password = screen.getByLabelText(/Contraseña/);
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: COPY.actions.show }));
    expect(password).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: COPY.actions.hide }));
    expect(password).toHaveAttribute("type", "password");
  });

  it("signs in with valid credentials", async () => {
    const user = userEvent.setup();
    const service = new FakeAuthService();
    renderWithProviders(<LoginPage />, { authService: service });

    await user.type(screen.getByLabelText(/Usuario/), "yokasta.reyes");
    await user.type(screen.getByLabelText(/Contraseña/), "correcta");
    await user.click(screen.getByRole("button", { name: COPY.actions.signIn }));

    // The form is left behind on success; the router takes over from here.
    expect(
      screen.queryByText(COPY.errors.invalidCredentials),
    ).not.toBeInTheDocument();
  });

  it("does not show the form to a teacher who is already signed in", async () => {
    renderWithProviders(<LoginPage />, {
      authService: new FakeAuthService({ initialUser: TEST_USER }),
    });

    // The session resolves and the page redirects, so the form unmounts.
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: COPY.actions.signIn }),
      ).not.toBeInTheDocument();
    });
  });

  it("offers a way back to the public consultation", () => {
    renderWithProviders(<LoginPage />, { authService: new FakeAuthService() });

    expect(
      screen.getByRole("link", { name: COPY.actions.backToPublic }),
    ).toHaveAttribute("href", "/");
  });
});
