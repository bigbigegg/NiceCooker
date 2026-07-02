import type { FurnitureType, FurnitureVariant } from '@/renderer/types';

export type FurnitureCategory = 'table' | 'chair' | 'sofa' | 'light' | 'plant' | 'decoration';

export interface FurnitureCatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  furnitureType: FurnitureType;
  /** 占网格数（宽×高），每个格子 64px */
  size: { width: number; height: number };
  cost: number;
  unlockLevel: number;
  variant: FurnitureVariant;
  envScore: number;
}

export const FURNITURE_CATALOG: FurnitureCatalogItem[] = [
  { id: 'table2_basic', name: '2人桌', category: 'table', furnitureType: 'table2',
    size: { width: 1, height: 1 }, cost: 50, unlockLevel: 1, variant: 'basic', envScore: 5 },
  { id: 'table2_premium', name: '2人桌(高级)', category: 'table', furnitureType: 'table2',
    size: { width: 1, height: 1 }, cost: 150, unlockLevel: 3, variant: 'premium', envScore: 10 },
  { id: 'table4_basic', name: '4人桌', category: 'table', furnitureType: 'table4',
    size: { width: 1, height: 1 }, cost: 100, unlockLevel: 2, variant: 'basic', envScore: 8 },
  { id: 'table4_premium', name: '4人桌(高级)', category: 'table', furnitureType: 'table4',
    size: { width: 1, height: 1 }, cost: 300, unlockLevel: 5, variant: 'premium', envScore: 16 },
  { id: 'sofa_basic', name: '沙发', category: 'sofa', furnitureType: 'sofa',
    size: { width: 2, height: 1 }, cost: 200, unlockLevel: 3, variant: 'basic', envScore: 15 },
  { id: 'sofa_premium', name: '沙发(高级)', category: 'sofa', furnitureType: 'sofa',
    size: { width: 2, height: 1 }, cost: 500, unlockLevel: 7, variant: 'premium', envScore: 25 },
  { id: 'barstool_basic', name: '吧台凳', category: 'chair', furnitureType: 'barStool',
    size: { width: 1, height: 1 }, cost: 30, unlockLevel: 1, variant: 'basic', envScore: 3 },
  { id: 'barstool_premium', name: '吧台凳(高级)', category: 'chair', furnitureType: 'barStool',
    size: { width: 1, height: 1 }, cost: 80, unlockLevel: 4, variant: 'premium', envScore: 7 },
];

export const GRID_SIZE = 64;
export const GRID_COLS = 10;
export const GRID_ROWS = 8;
