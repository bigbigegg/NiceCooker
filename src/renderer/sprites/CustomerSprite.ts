import { Container, Graphics, Text } from 'pixi.js';
import type { CustomerInstance, CustomerTypeId } from '@/types/customer';
import type { Position } from '@/types';
import { CUSTOMER_COLORS } from '../types';

/** 顾客类型对应颜色 */
const TYPE_COLORS: Record<CustomerTypeId, number> = {
  officeWorker: CUSTOMER_COLORS.officeWorker!,
  student: CUSTOMER_COLORS.student!,
  retiree: CUSTOMER_COLORS.retiree!,
  influencer: CUSTOMER_COLORS.influencer!,
  business: CUSTOMER_COLORS.business!,
  artist: CUSTOMER_COLORS.artist!,
  special: CUSTOMER_COLORS.special!,
};

/** 菜品图标映射（emoji） */
const RECIPE_ICONS: Record<string, string> = {
  americano: '☕',
  latte: '🥛',
  mocha: '🍫',
  cappuccino: '☕',
  espresso: '⚫',
  pour_over: '🫖',
  cold_brew: '🧊',
  single_origin: '🌱',
  latte_art: '🎨',
  classic: '☕',
  special: '✨',
  dessert: '🍰',
};

/** 头部半径 */
const HEAD_RADIUS = 10;
/** 身体宽度 */
const BODY_W = 15;
/** 身体高度 */
const BODY_H = 18;
/** 身体圆角 */
const BODY_R = 4;

/**
 * 顾客精灵
 *
 * Q 版二头身角色：圆形头 + 圆角矩形身体。
 * 头顶气泡显示满意度、订单图标、等待进度。
 * 支持 entering / waiting / eating / leaving 状态动画。
 */
export class CustomerSprite extends Container {
  private customerId: string;
  private typeId: CustomerTypeId;
  private headGfx: Graphics;
  private bodyGfx: Graphics;
  private bubbleContainer: Container;
  private animTimer: number;
  private _state: string;
  private _position: Position;

  constructor(customer: CustomerInstance, position: Position) {
    super();
    this.customerId = customer.id;
    this.typeId = customer.typeId;
    this.animTimer = 0;
    this._state = customer.state;
    this._position = { ...position };

    const color = TYPE_COLORS[this.typeId];

    this.headGfx = new Graphics();
    this.bodyGfx = new Graphics();
    this.bubbleContainer = new Container();
    this.bubbleContainer.visible = false;

    this.drawCharacter(color);
    this.addChild(this.bubbleContainer);
    this.addChild(this.bodyGfx);
    this.addChild(this.headGfx);

    this.x = position.x;
    this.y = position.y;
  }

  /** 绘制角色 */
  private drawCharacter(color: number): void {
    // 身体（圆角矩形）
    this.bodyGfx.clear();
    this.bodyGfx.roundRect(-BODY_W / 2, -BODY_H / 2, BODY_W, BODY_H, BODY_R);
    this.bodyGfx.fill({ color });

    // 头部（圆形）
    this.headGfx.clear();
    const headY = -BODY_H / 2 - HEAD_RADIUS + 1;
    this.headGfx.circle(0, headY, HEAD_RADIUS);
    this.headGfx.fill({ color });

    // 眼睛（白色+黑色瞳孔）
    this.headGfx.circle(-4, headY - 2, 2.5);
    this.headGfx.fill({ color: 0xFFFFFF });
    this.headGfx.circle(-4, headY - 2, 1.3);
    this.headGfx.fill({ color: 0x212121 });

    this.headGfx.circle(4, headY - 2, 2.5);
    this.headGfx.fill({ color: 0xFFFFFF });
    this.headGfx.circle(4, headY - 2, 1.3);
    this.headGfx.fill({ color: 0x212121 });

    // 微笑
    this.headGfx.arc(0, headY + 2, 4, 0.2, Math.PI - 0.2);
    this.headGfx.stroke({ color: 0x212121, width: 1 });

    // 腮红
    this.headGfx.circle(-7, headY + 3, 2);
    this.headGfx.fill({ color: 0xFF8A80, alpha: 0.3 });
    this.headGfx.circle(7, headY + 3, 2);
    this.headGfx.fill({ color: 0xFF8A80, alpha: 0.3 });
  }

  /**
   * 更新头顶气泡
   * @param satisfaction - 满意度 0-100
   * @param orderRecipeId - 订单菜品 ID
   * @param waitProgress - 等待进度 0-1
   */
  updateBubble(
    satisfaction: number,
    orderRecipeId: string | null,
    waitProgress: number,
  ): void {
    const bubble = this.bubbleContainer;
    bubble.removeChildren();

    const bubbleW = 56;
    const bubbleH = 52;
    const bubbleX = -bubbleW / 2;
    const bubbleY = -BODY_H / 2 - HEAD_RADIUS * 2 - bubbleH - 2;

    // 气泡背景
    const bg = new Graphics();
    bg.roundRect(bubbleX, bubbleY, bubbleW, bubbleH, 5);
    bg.fill({ color: 0xFFFFFF, alpha: 0.92 });
    bg.stroke({ color: 0xBDBDBD, width: 1 });

    // 气泡三角
    bg.moveTo(-4, bubbleY + bubbleH);
    bg.lineTo(0, bubbleY + bubbleH + 5);
    bg.lineTo(4, bubbleY + bubbleH);
    bg.fill({ color: 0xFFFFFF });
    bubble.addChild(bg);

    // 满意度图标
    const moodIcon = this.getMoodIcon(satisfaction);
    const moodText = new Text({
      text: moodIcon,
      style: { fontSize: 14, fontFamily: 'Arial' },
    });
    moodText.anchor.set(0.5, 0);
    moodText.y = bubbleY + 4;
    bubble.addChild(moodText);

    // 订单图标
    const recipeIcon = orderRecipeId ? (RECIPE_ICONS[orderRecipeId] ?? '📋') : '📋';
    const orderText = new Text({
      text: recipeIcon,
      style: { fontSize: 12, fontFamily: 'Arial' },
    });
    orderText.anchor.set(0.5, 0);
    orderText.y = bubbleY + 20;
    bubble.addChild(orderText);

    // 等待进度条背景
    const barBg = new Graphics();
    barBg.roundRect(bubbleX + 8, bubbleY + 38, bubbleW - 16, 4, 2);
    barBg.fill({ color: 0xE0E0E0 });
    bubble.addChild(barBg);

    // 等待进度条
    const clamped = Math.max(0, Math.min(1, waitProgress));
    const barColor =
      clamped > 0.6 ? 0xEF5350 : clamped > 0.3 ? 0xFFCA28 : 0x66BB6A;
    const barFill = new Graphics();
    barFill.roundRect(bubbleX + 8, bubbleY + 38, (bubbleW - 16) * clamped, 4, 2);
    barFill.fill({ color: barColor });
    bubble.addChild(barFill);

    bubble.visible = true;
  }

  /** 隐藏气泡 */
  hideBubble(): void {
    this.bubbleContainer.visible = false;
    this.bubbleContainer.removeChildren();
  }

  /**
   * 更新状态动画
   */
  updateAnimation(state: string, deltaSeconds: number): void {
    this._state = state;
    this.animTimer += deltaSeconds;

    switch (state) {
      case 'entering':
        this.alpha = Math.min(1, this.alpha + deltaSeconds * 2.5);
        break;
      case 'waiting':
      case 'ordering':
        // 轻微左右摆动
        this.x = this._position.x + Math.sin(this.animTimer * 3) * 1.5;
        break;
      case 'eating':
        // 坐姿：身体压扁一点
        this.scale.y = 0.85;
        this.scale.x = 1.1;
        break;
      case 'leaving':
        this.alpha = Math.max(0, this.alpha - deltaSeconds * 2.5);
        break;
    }
  }

  /** 更新世界坐标位置 */
  updatePosition(pos: Position): void {
    this._position = { ...pos };
    if (this._state !== 'waiting' && this._state !== 'ordering') {
      this.x = pos.x;
    }
    this.y = pos.y;
  }

  /** 获取顾客 ID */
  getCustomerId(): string {
    return this.customerId;
  }

  /** 获取满意度图标 */
  private getMoodIcon(satisfaction: number): string {
    if (satisfaction >= 80) return '\u{1F604}';
    if (satisfaction >= 60) return '\u{1F642}';
    if (satisfaction >= 40) return '\u{1F610}';
    if (satisfaction >= 20) return '\u{1F61F}';
    return '\u{1F621}';
  }
}
