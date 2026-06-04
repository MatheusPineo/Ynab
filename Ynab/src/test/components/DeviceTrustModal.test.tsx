import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceTrustModal } from '@/shared/components/security/DeviceTrustModal';

// Mock do auth store
vi.mock('@/modules/auth/store/useAuthStore', () => ({
  useAuthStore: () => ({
    accessToken: 'test-access-token',
    isAuthenticated: true,
  }),
}));

// Mock do Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => true,
    getPlatform: () => 'web',
  },
  registerPlugin: () => ({
    getDeviceKey: vi.fn().mockResolvedValue({ key: null }),
    storeDeviceKey: vi.fn().mockResolvedValue({}),
  }),
}));

describe('DeviceTrustModal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should render modal when DEVICE_KEY is missing on boot', async () => {
    render(<DeviceTrustModal />);
    expect(await screen.findByText('Confiar neste aparelho?')).toBeInTheDocument();
  });

  it('should not render modal if DEVICE_KEY exists in localStorage', async () => {
    localStorage.setItem('DEVICE_KEY', 'existing-key');
    render(<DeviceTrustModal />);
    // Aguarda um ciclo para garantir que a verificação assíncrona rode
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(screen.queryByText('Confiar neste aparelho?')).not.toBeInTheDocument();
  });

  it('should call API on Sim click and save token to localStorage upon success', async () => {
    const mockToken = 'mocked-device-token';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: mockToken }),
    });
    global.fetch = fetchMock;

    render(<DeviceTrustModal />);

    const simButton = await screen.findByText('Sim');
    fireEvent.click(simButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(localStorage.getItem('DEVICE_KEY')).toBe(mockToken);
      expect(screen.queryByText('Confiar neste aparelho?')).not.toBeInTheDocument();
    });
  });

  it('should handle API errors and show error toast without crashing', async () => {
    const errorMsg = 'Invalid device key format.';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ detail: errorMsg }),
    });
    global.fetch = fetchMock;

    render(<DeviceTrustModal />);

    const simButton = await screen.findByText('Sim');
    fireEvent.click(simButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      expect(localStorage.getItem('DEVICE_KEY')).toBeNull();
      // O modal não deve sumir em caso de erro
      expect(screen.getByText('Confiar neste aparelho?')).toBeInTheDocument();
    });
  });
});
