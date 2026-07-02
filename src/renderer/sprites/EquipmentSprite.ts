import { Container, Graphics, Text } from 'pixi.js';
import type { EquipmentData, EquipmentType } from '../types';

/** 设备主体色系 */
const EQUIPMENT_COLORS: Record<EquipmentType, number> = {
  coffeeMachine: 0x6D4C41,  // 棕色系
  oven: 0x5D4037,           // 深棕
  grinder: 0x4E342E,        // 深褐
};

/** 等级颜色增量（等级越高颜色越深） */
const LEVEL_COLOR_DELTA = 0x0A0A0A;

/**
 * 设备精灵
 *
 * 使用 PixiJS Graphics 绘制不同设备的外观。
 * 支持 5 个等级，等级越高颜色越深、细节越多。
 */
export class EquipmentSprite extends Container {
  private data: EquipmentData;
  private gfx: Graphics;
  private label: Text;

  constructor(data: EquipmentData) {
    super();
    this.data = data;
    this.gfx = new Graphics();
    this.label = new Text({
      text: '',
      style: { fontSize: 10, fontFamily: 'Arial', fill: 0xFFFFFF },
    });

    this.draw();
    this.addChild(this.gfx);
    this.addChild(this.label);

    this.x = data.position.x;
    this.y = data.position.y;
  }

  /** 获取等级深色偏移 */
  private getLevelColorOffset(): number {
    return (this.data.level - 1) * 0x111111;
  }

  /** 绘制设备 */
  private draw(): void {
    switch (this.data.type) {
      case 'coffeeMachine':
        this.drawCoffeeMachine();
        break;
      case 'oven':
        this.drawOven();
        break;
      case 'grinder':
        this.drawGrinder();
        break;
    }
  }

  /** 绘制咖啡机 */
  private drawCoffeeMachine(): void {
    const g = this.gfx;
    const baseColor = EQUIPMENT_COLORS.coffeeMachine + this.getLevelColorOffset();
    const w = this.data.width;
    const h = this.data.height;
    const cx = 0;
    const cy = 0;

    g.clear();

    // 主体（方形）
    g.roundRect(cx - w / 2, cy - h / 2, w, h, 6);
    g.fill({ color: baseColor });
    g.stroke({ color: 0x3E2723, width: 2 });

    // 前面板
    g.roundRect(cx - w / 2 + 4, cy - h / 2 + 4, w - 8, h - 16, 3);
    g.fill({ color: 0xBCAAA4 });

    // 按钮（圆形）
    const btnY = cy + h / 2 - 10;
    g.circle(cx - w / 6, btnY, 4);
    g.fill({ color: 0xEF5350 });
    g.circle(cx + w / 6, btnY, 4);
    g.fill({ color: 0x66BB6A });

    // 蒸汽口（顶部）
    g.rect(cx - 3, cy - h / 2 - 5, 6, 5);
    g.fill({ color: 0x795548 });

    // 等级 >= 3 时增加细节：压力表
    if (this.data.level >= 3) {
      g.circle(cx, cy, 5);
      g.fill({ color: 0xFFF9C4 });
      g.stroke({ color: 0x3E2723, width: 1 });
      // 指针
      g.rect(cx, cy - 3, 1, 5);
      g.fill({ color: 0xFF5722 });
    }

    // 等级 >= 5 时增加装饰
    if (this.data.level >= 5) {
      g.rect(cx + w / 2 - 2, cy - h / 2, 2, h / 2);
      g.fill({ color: 0xFFC107 });
    }

    this.label.text = `咖啡机 Lv${this.data.level}`;
    this.label.anchor.set(0.5, 0);
    this.label.y = cy + h / 2 + 4;
  }

  /** 绘制烤箱 */
  private drawOven(): void {
    const g = this.gfx;
    const baseColor = EQUIPMENT_COLORS.oven + this.getLevelColorOffset();
    const w = this.data.width;
    const h = this.data.height;
    const cx = 0;
    const cy = 0;

    g.clear();

    // 主体（方形）
    g.roundRect(cx - w / 2, cy - h / 2, w, h, 4);
    g.fill({ color: baseColor });
    g.stroke({ color: 0x3E2723, width: 2 });

    // 门框
    g.roundRect(cx - w / 2 + 6, cy - h / 2 + 4, w - 12, h - 20, 3);
    g.fill({ color: 0x424242 });
    g.stroke({ color: 0x212121, width: 1 });

    // 玻璃窗口
    g.roundRect(cx - w / 4, cy - h / 4, w / 2, h * 0.4, 3);
    g.fill({ color: 0xFF8A65, alpha: 0.6 });
    g.stroke({ color: 0x3E2723, width: 1 });

    // 把手
    g.roundRect(cx - 8, cy + h / 2 - 12, 16, 4, 2);
    g.fill({ color: 0xBDBDBD });
    g.stroke({ color: 0x757575, width: 1 });

    // 旋钮
    g.circle(cx - w / 3, cy + h / 2 - 8, 3);
    g.fill({ color: 0xEEEEEE });
    g.circle(cx + w / 3, cy + h / 2 - 8, 3);
    g.fill({ color: 0xEEEEEE });

    // 等级 >= 4 时增加装饰灯
    if (this.data.level >= 4) {
      g.circle(cx + w / 2 - 8, cy - h / 2 + 8, 3);
      g.fill({ color: 0x4CAF50 });
    }

    this.label.text = `烤箱 Lv${this.data.level}`;
    this.label.anchor.set(0.5, 0);
    this.label.y = cy + h / 2 + 4;
  }

  /** 绘制磨豆机 */
  private drawGrinder(): void {
    const g = this.gfx;
    const baseColor = EQUIPMENT_COLORS.grinder + this.getLevelColorOffset();
    const w = this.data.width;
    const h = this.data.height;
    const cx = 0;
    const cy = 0;

    g.clear();

    // 底座（扁方盒）
    g.roundRect(cx - w / 2, cy, w, h * 0.4, 3);
    g.fill({ color: baseColor });
    g.stroke({ color: 0x3E2723, width: 2 });

    // 豆仓（上部较窄）
    g.roundRect(cx - w / 3, cy - h * 0.25, w * 0.66, h * 0.3, 3);
    g.fill({ color: 0x8D6E63 });
    g.stroke({ color: 0x4E342E, width: 1 });

    // 盖子
    g.roundRect(cx - w / 3 + 2, cy - h * 0.35, w * 0.66 - 4, h * 0.1, 2);
    g.fill({ color: 0xA1887F });

    // 旋钮
    g.circle(cx + w / 2, cy + h * 0.15, 4);
    g.fill({ color: 0xEEEEEE });
    g.stroke({ color: 0x9E9E9E, width: 1 });

    // 出粉口
    g.rect(cx - 3, cy, 6, 4);
    g.fill({ color: 0x3E2723 });

    // 等级 >= 3 时增加刻度盘
    if (this.data.level >= 3) {
      g.arc(cx + w / 2, cy + h * 0.15, 6, -Math.PI * 0.8, Math.PI * 0.2);
      g.stroke({ color: 0xFFC107, width: 1 });
    }

    this.label.text = `磨豆机 Lv${this.data.level}`;
    this.label.anchor.set(0.5, 0);
    this.label.y = cy + h * 0.4 + 4;
  }

  /** 获取设备 ID */
  getEquipmentId(): string {
    return this.data.id;
  }

  /** 更新设备数据并重绘 */
  updateData(data: Partial<EquipmentData>): void {
    Object.assign(this.data, data);
    if (data.position) {
      this.x = data.position.x;
      this.y = data.position.y;
    }
    this.draw();
  }
}
