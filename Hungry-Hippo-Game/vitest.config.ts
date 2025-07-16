import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        include: ['src/**/*.{test,spec}.{js,ts,tsx}'],
        environment: 'jsdom',
        coverage: {
            reporter: ['text','html'],
            reportsDirectory: '../documentation/static/coverage',
        }
    }
})