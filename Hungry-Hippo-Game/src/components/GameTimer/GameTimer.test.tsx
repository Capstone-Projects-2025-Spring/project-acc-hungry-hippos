
import { render, screen } from '@testing-library/react';
import GameTimer from './GameTimer';
import { vi } from 'vitest';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        
    },
})

vi.mock('../../contexts/WebSocketContext', () => ({
    useWebSocket: () => ({
        lastMessage: null,
    }),
}));

describe('GameTimer component', () => {
    it('shows waiting message when no timer message received', () => {
        render(<GameTimer />);
        expect(screen.getByText(/waiting for timer/i)).toBeInTheDocument();
    });
})