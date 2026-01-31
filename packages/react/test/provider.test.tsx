import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UPSProvider, useUPSClient } from '../src/index';
// Need to mock QueryClientProvider since UPSProvider uses it internally or expects it?
// Based on task description, UPSProvider wraps children.
// If UPSProvider expects a QueryClientProvider parent, we should check implementation.
// Assuming UPSProvider handles its own context or we need to wrap it.
// The render utility already wraps with QueryClientProvider.

import { renderWithProviders } from '../../../test/utils/render';

const TestComponent = () => {
    const client = useUPSClient();
    return <div>Client exists: {client ? 'yes' : 'no'}</div>;
};

describe('UPSProvider', () => {
    it('should provide UPS context to children', () => {
        renderWithProviders(<TestComponent />);
        expect(screen.getByText('Client exists: yes')).toBeInTheDocument();
    });

    it('should throw error when useUPSClient called outside provider', () => {
        // Suppress console.error for this test
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => render(<TestComponent />)).toThrow();

        consoleSpy.mockRestore();
    });
});
