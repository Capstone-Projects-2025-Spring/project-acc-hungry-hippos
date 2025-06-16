
/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AacInterface from './AacInterface';
import { AacFood } from '../Foods';

// 1. Mock the AAC_DATA import 
vi.mock('../Foods', () => ({
  AAC_DATA: {
    categories: [
      {
        categoryName: 'Fruits',
        categoryIcon: '/fake/fruits.png',
        foods: [
          { id: 'apple', name: 'Apple', imagePath: '/fake/apple.png', audioPath: '/fake/apple.mp3' },
          { id: 'banana', name: 'Banana', imagePath: '/fake/banana.png', audioPath: '/fake/banana.mp3' },
        ],
      },
    ],
  },
}));

// Mock the audio object globally to prevent actual audio playback
const mockAudio = vi.fn(() => ({
  play: vi.fn(),
  onended: vi.fn(),
  onerror: vi.fn(),
}));
vi.stubGlobal('Audio', mockAudio);

describe('AacInterface Component', () => {
  it('should call onFoodSelected with the correct food when a food item is clicked', async () => {
    const mockOnFoodSelected = vi.fn();
    
    // Render the AacInterface component with the mock callback.
    render(<AacInterface onFoodSelected={mockOnFoodSelected} />);
    
    const user = userEvent.setup();
    const categoryButton = screen.getByRole('button', { name: /fruits/i });
    await user.click(categoryButton);

    const appleButton = await screen.findByRole('button', { name: /apple/i });
    await user.click(appleButton);

    expect(mockOnFoodSelected).toHaveBeenCalledTimes(1);

    const expectedAppleData: AacFood = {
      id: 'apple',
      name: 'Apple',
      imagePath: '/fake/apple.png',
      audioPath: '/fake/apple.mp3',
    };
    expect(mockOnFoodSelected).toHaveBeenCalledWith(expectedAppleData);
  });
});
