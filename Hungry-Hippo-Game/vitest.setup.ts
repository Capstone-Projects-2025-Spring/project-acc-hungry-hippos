import { vi } from 'vitest';
import { EventEmitter } from 'events';
import '@testing-library/jest-dom/vitest';

vi.mock('phaser', () => ({
  Events: { EventEmitter },
}));

window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};