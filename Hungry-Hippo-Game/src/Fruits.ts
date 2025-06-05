import aacFruitData from './data/fruits.json';

export interface Fruit {
    id: string;
    name: string;
    imagePath: string;
    audioPath: string; 
}

export const AAC_ITEMS: Fruit[] = aacFruitData as Fruit[];
