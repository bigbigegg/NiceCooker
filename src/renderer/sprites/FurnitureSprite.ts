import { Container, Graphics, Text } from 'pixi.js';
import type { FurnitureData, FurnitureType, FurnitureVariant } from '../types';

/** 基础木色 */
const BASIC_WOOD = 0x8D6E63;
/** 高级木色 */
const PREMIUM_WOOD = 0x6D4C41;

/** 颜色映射 */
function getWoodColor(variant: FurnitureVariant): number {
  return variant === 'premium' ? PREMIUM_WOOD : BASIC_WOOD;
}

/** 各家具类型的默认尺寸（宽 x 高） */
const FURNITURE_SIZES: Record<FurnitureType, { w: number; h: number }> = {
  table2: { w: 48, h: 36 },
  table4: { w: 64, h: 64 },
  sofa: { w: 72, h: 36 },
  barStool: { w: 20, h: 20 },
};

/** 家具类型显示名称 */
const FURNITURE_NAMES: Record<FurnitureType, string> = {
  table2: '2人桌',
  table4: '4人桌',
  sofa: '沙发',
  barStool: '吧台凳',
};

/**
 * 家具精灵
 *
 * 使用 PixiJS Graphics 绘制不同类型的家具。
 */
export class FurnitureSprite extends Container {
  private data: FurnitureData;
  private gfx: Graphics;
  private labelText: Text;

  constructor(data: FurnitureData) {
    super();
    this.data = data;
    this.gfx = new Graphics();
    this.labelText = new Text({
      text: '',
      style: { fontSize: 10, fontFamily: 'Arial', fill: 0xFFFFFF },
    });

    this.draw();
    this.addChild(this.gfx);
    this.addChild(this.labelText);

    this.x = data.position.x;
    this.y = data.position.y;
  }

  /** 绘制家具 */
  private draw(): void {
    switch (this.data.type) {
      case 'table2':
        this.drawTable2();
        break;
      case 'table4':
        this.drawTable4();
        break;
      case 'sofa':
        this.drawSofa();
        break;
      case 'barStool':
        this.drawBarStool();
        break;
    }
  }

  /** 绘制 2 人方桌 + 两把椅子 */
  private drawTable2(): void {
    const g = this.gfx;
    const color = getWoodColor(this.data.variant);
    const w = this.data.width;
    const h = this.data.height;
    const cx = 0;
    const cy = 0;

    g.clear();

    // 桌面（矩形）
    g.roundRect(cx - w / 2, cy - h / 2, w, h, 4);
    g.fill({ color });
    g.stroke({ color: 0x4E342E, width: 2 });

    // 桌面纹理（横线）
    g.rect(cx - w / 3, cy - h / 3, w * 0.66, 1);
    g.fill({ color: 0x795548 });
    g.rect(cx - w / 3, cy + h / 3, w * 0.66, 1);
    g.fill({ color: 0x795548 });

    // 桌腿（4个小方块）
    const legSize = 4;
    g.rect(cx - w / 2 + 2, cy - h / 2 + 2, legSize, legSize);
    g.fill({ color: 0x5D4037 });
    g.rect(cx + w / 2 - legSize - 2, cy - h / 2 + 2, legSize, legSize);
    g.fill({ color: 0x5D4037 });
    g.rect(cx - w / 2 + 2, cy + h / 2 - legSize - 2, legSize, legSize);
    g.fill({ color: 0x5D4037 });
    g.rect(cx + w / 2 - legSize - 2, cy + h / 2 - legSize - 2, legSize, legSize);
    g.fill({ color: 0x5D4037 });

    // 椅子（左侧）
    this.drawChair(g, cx - w / 2 - 10, cy, color);
    // 椅子（右侧）
    this.drawChair(g, cx + w / 2 + 10, cy, color);

    this.labelText.text = FURNITURE_NAMES.table2;
    this.labelText.anchor.set(0.5, 0);
    this.labelText.y = cy + h / 2 + 14;
  }

  /** 绘制 4 人方桌 + 四把椅子 */
  private drawTable4(): void {
    const g = this.gfx;
    const color = getWoodColor(this.data.variant);
    const w = this.data.width;
    const h = this.data.height;
    const cx = 0;
    const cy = 0;

    g.clear();

    // 桌面
    g.roundRect(cx - w / 2, cy - h / 2, w, h, 4);
    g.fill({ color });
    g.stroke({ color: 0x4E342E, width: 2 });

    // 桌面纹理
    g.rect(cx - w / 3, cy - h / 3, w * 0.66, 1);
    g.fill({ color: 0x795548 });
    g.rect(cx - w / 3, cy + h / 3, w * 0.66, 1);
    g.fill({ color: 0x795548 });

    // 桌腿
    const legSize = 4;
    g.rect(cx - w / 2 + 2, cy - h / 2 + 2, legSize, legSize);
    g.fill({ color: 0x5D4037 });
    g.rect(cx + w / 2 - legSize - 2, cy - h / 2 + 2, legSize, legSize);
    g.fill({ color: 0x5D4037 });
    g.rect(cx - w / 2 + 2, cy + h / 2 - legSize - 2, legSize, legSize);
    g.fill({ color: 0x5D4037 });
    g.rect(cx + w / 2 - legSize - 2, cy + h / 2 - legSize - 2, legSize, legSize);
    g.fill({ color: 0x5D4037 });

    // 四把椅子
    this.drawChair(g, cx - w / 2 - 10, cy - h / 4, color);
    this.drawChair(g, cx - w / 2 - 10, cy + h / 4, color);
    this.drawChair(g, cx + w / 2 + 10, cy - h / 4, color);
    this.drawChair(g, cx + w / 2 + 10, cy + h / 4, color);

    this.labelText.text = FURNITURE_NAMES.table4;
    this.labelText.anchor.set(0.5, 0);
    this.labelText.y = cy + h / 2 + 20;
  }

  /** 绘制沙发 */
  private drawSofa(): void {
    const g = this.gfx;
    const color = getWoodColor(this.data.variant);
    const w = this.data.width;
    const h = this.data.height;
    const cx = 0;
    const cy = 0;

    g.clear();

    // 底座
    g.roundRect(cx - w / 2, cy + h * 0.1, w, h * 0.4, 4);
    g.fill({ color });
    g.stroke({ color: 0x4E342E, width: 2 });

    // 靠背
    g.roundRect(cx - w / 2, cy - h / 2, w, h * 0.65, 6);
    g.fill({ color: color + 0x111111 });
    g.stroke({ color: 0x4E342E, width: 1 });

    // 坐垫分割线
    g.rect(cx, cy + h * 0.1, 1, h * 0.35);
    g.fill({ color: 0x5D4037 });

    // 扶手（两侧）
    g.roundRect(cx - w / 2 - 4, cy, 8, h * 0.6, 3);
    g.fill({ color: color - 0x111111 });
    g.roundRect(cx + w / 2 - 4, cy, 8, h * 0.6, 3);
    g.fill({ color: color - 0x111111 });

    this.labelText.text = FURNITURE_NAMES.sofa;
    this.labelText.anchor.set(0.5, 0);
    this.labelText.y = cy + h / 2 + 16;
  }

  /** 绘制吧台凳 */
  private drawBarStool(): void {
    const g = this.gfx;
    const color = getWoodColor(this.data.variant);
    const w = this.data.width;
    const h = this.data.height;
    const cx = 0;
    const cy = 0;

    g.clear();

    // 座面（小圆角矩形）
    g.roundRect(cx - w / 2, cy - h * 0.1, w, h * 0.35, 4);
    g.fill({ color });
    g.stroke({ color: 0x4E342E, width: 1 });

    // 凳腿（金属杆）
    g.rect(cx - 2, cy + h * 0.25, 4, h * 0.5);
    g.fill({ color: 0x9E9E9E });

    // 底座
    g.roundRect(cx - w / 2 + 2, cy + h * 0.7, w - 4, h * 0.15, 2);
    g.fill({ color: 0x757575 });

    // 靠背小半弧（可选，某些吧台凳有）
    g.arc(cx, cy - h * 0.1, w * 0.3, Math.PI, 0);
    g.stroke({ color: 0x757575, width: 2 });

    this.labelText.text = FURNITURE_NAMES.barStool;
    this.labelText.anchor.set(0.5, 0);
    this.labelText.y = cy + h / 2 + 8;
  }

  /** 绘制一把椅子（通用） */
  private drawChair(g: Graphics, x: number, y: number, color: number): void {
    const seatW = 14;
    const seatH = 14;

    // 座面
    g.roundRect(x - seatW / 2, y - seatH / 2, seatW, seatH, 3);
    g.fill({ color });
    g.stroke({ color: 0x4E342E, width: 1 });

    // 靠背
    g.rect(x - seatW / 2 + 1, y - seatH / 2 - 6, seatW - 2, 3);
    g.fill({ color: 0x5D4037 });
  }

  /** 获取家具 ID */
  getFurnitureId(): string {
    return this.data.id;
  }

  /** 更新位置 */
  updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.data.position = { x, y };
  }

  /** 显示半透明虚影模式 */
  setGhostMode(active: boolean): void {
    this.alpha = active ? 0.5 : 1.0;
  }

  /** 显示选中高亮 */
  showHighlight(active: boolean): void {
    if (active) {
      const h = new Graphics();
      h.label = 'highlight';
      h.roundRect(-this.data.width / 2 - 2, -this.data.height / 2 - 2, this.data.width + 4, this.data.height + 4, 4);
      h.stroke({ color: 0xFFC107, width: 2 });
      this.addChild(h);
    } else {
      const existing = this.children.find((c) => c.label === 'highlight');
      if (existing) this.removeChild(existing);
    }
  }

  /** 设置旋转 */
  setRotation(deg: 0 | 90 | 180 | 270): void {
    this.angle = deg;
    this.data.rotation = deg;
  }

  /** 获取家具数据 */
  getFurnitureData(): Readonly<FurnitureData> {
    return this.data;
  }
}
