import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { InboxMobileSyncActivation } from "@/modules/finance/components/InboxMobileSyncActivation";

// Mock useAuthStore
vi.mock("@/modules/auth/store/useAuthStore", () => ({
  useAuthStore: () => ({
    accessToken: "test-token",
  }),
}));

// Mock Capacitor
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
  registerPlugin: () => ({}),
}));

// Mock Telemetry
vi.mock("@/shared/lib/telemetry", () => ({
  trackFormValidationFailure: vi.fn(),
  trackHandledException: vi.fn(),
}));

describe("InboxMobileSyncActivation (Regression)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should render authorized form", () => {
    render(<InboxMobileSyncActivation />);
    expect(screen.getByLabelText("Nome do Dispositivo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Autorizar" })).toBeInTheDocument();
  });

  it("should validate and require a device name", async () => {
    render(<InboxMobileSyncActivation />);
    const button = screen.getByRole("button", { name: "Autorizar" });
    fireEvent.click(button);
    expect(screen.getByLabelText("Nome do Dispositivo")).toBeInTheDocument();
  });

  it("should submit request and invoke onDeviceAdded callback", async () => {
    const onDeviceAddedMock = vi.fn();
    const mockToken = "mocked-auth-token-123";
    
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 10,
        device_name: "Celular do Matheus",
        custom_name: "Celular do Matheus",
        token: mockToken,
        created_at: "2026-06-04T19:00:00Z"
      }),
    });
    global.fetch = fetchMock;

    render(<InboxMobileSyncActivation onDeviceAdded={onDeviceAddedMock} />);

    const input = screen.getByPlaceholderText("Ex: Meu Samsung S24");
    fireEvent.change(input, { target: { value: "Celular do Matheus" } });

    const button = screen.getByRole("button", { name: "Autorizar" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(onDeviceAddedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          custom_name: "Celular do Matheus",
          token: mockToken
        })
      );
      expect(localStorage.getItem("DEVICE_KEY")).toBe(mockToken);
    });
  });
});
