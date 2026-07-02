import type { Position } from '@/types';

/** 设备类型 */
export type EquipmentType = 'coffeeMachine' | 'oven' | 'grinder';

/** 家具类型 */
export type FurnitureType = 'table2' | 'table4' | 'sofa' | 'barStool';

/** 家具档次 */
export type FurnitureVariant = 'basic' | 'premium';

/** 设备渲染数据 */
export interface EquipmentData {
  id: string;
  type: EquipmentType;
  level: number;         // 1-5
  position: Position;
  width: number;
  height: number;
}

/** 家具渲染数据 */
export interface FurnitureData {
  id: string;
  type: FurnitureType;
  position: Position;
  width: number;
  height: number;
  variant: FurnitureVariant;
}

/** 店铺布局数据 */
export interface ShopLayout {
  furniture: FurnitureData[];
  equipment: EquipmentData[];
}

/**
 * 顾客类型对应颜色（用于精灵绘制）
 */
export const CUSTOMER_COLORS: Record<string, number> = {
  officeWorker: 0x455A64,
  student: 0x81C784,
  retiree: 0xA1887F,
  influencer: 0xF48FB1,
  business: 0x37474F,
  artist: 0x9575CD,
  special: 0xFFD54F,
};
