import { GRID_COLS, GRID_ROWS, GRID_SIZE } from '@/config/furniture';
import type { Position } from '@/types';

interface OccupancyCell {
  occupied: boolean;
  furnitureId: string | null;
}

/**
 * 网格系统 — 纯逻辑，管理咖啡厅地板的占用状态
 *
 * - 10 列 × 8 行，每格 64×64px
 * - 提供坐标转换、碰撞检测、占用管理
 */
export class GridSystem {
  private grid: OccupancyCell[][];

  constructor() {
    this.grid = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => ({ occupied: false, furnitureId: null })),
    );
  }

  /** 像素坐标 → 网格行列 */
  pixelToGrid(x: number, y: number): { row: number; col: number } {
    return {
      row: Math.floor(y / GRID_SIZE),
      col: Math.floor(x / GRID_SIZE),
    };
  }

  /** 网格行列 → 像素中心点 */
  gridToPixel(row: number, col: number): Position {
    return {
      x: col * GRID_SIZE + GRID_SIZE / 2,
      y: row * GRID_SIZE + GRID_SIZE / 2,
    };
  }

  /** 检查矩形区域是否在边界内 */
  isInBounds(row: number, col: number, width: number, height: number): boolean {
    return row >= 0 && col >= 0 && row + height <= GRID_ROWS && col + width <= GRID_COLS;
  }

  /** 检查矩形区域是否可放置（在边界内且不与其他家具重叠） */
  canPlace(row: number, col: number, width: number, height: number): boolean {
    if (!this.isInBounds(row, col, width, height)) return false;
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        if (this.grid[r]![c]!.occupied) return false;
      }
    }
    return true;
  }

  /** 占用指定矩形区域 */
  occupy(row: number, col: number, width: number, height: number, furnitureId: string): void {
    for (let r = row; r < row + height; r++) {
      for (let c = col; c < col + width; c++) {
        this.grid[r]![c] = { occupied: true, furnitureId };
      }
    }
  }

  /** 释放指定家具占用的所有格子 */
  release(furnitureId: string): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r]![c]!.furnitureId === furnitureId) {
          this.grid[r]![c] = { occupied: false, furnitureId: null };
        }
      }
    }
  }

  /** 重置整个网格 */
  reset(): void {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        this.grid[r]![c] = { occupied: false, furnitureId: null };
      }
    }
  }
}
