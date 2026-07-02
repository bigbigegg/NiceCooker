// === 基础游戏类型 ===

/** 游戏货币 */
export interface Currency {
  gold: number;
  diamond: number;
}

/** 2D 坐标 */
export interface Position {
  x: number;
  y: number;
}

/** 网格坐标 */
export interface GridPosition {
  row: number;
  col: number;
}

/** 游戏时间阶段 */
export type GamePhase =
  | 'dawn'       // 05:00-06:00 黎明
  | 'morning'    // 06:00-07:00 清晨
  | 'rush_am'    // 07:00-09:00 早高峰
  | 'forenoon'   // 09:00-11:00 上午
  | 'noon'       // 11:00-13:00 午高峰
  | 'afternoon'  // 13:00-14:00 下午早
  | 'tea_time'   // 14:00-16:00 下午茶
  | 'evening'    // 16:00-18:00 傍晚
  | 'rush_pm'    // 18:00-21:00 晚高峰
  | 'closing'    // 21:00-22:00 打烊
  | 'closed';    // 22:00-05:00 闭店

/** 游戏时间 */
export interface GameTime {
  day: number;
  hour: number;
  minute: number;
  phase: GamePhase;
  speed: 1 | 2 | 4;
  paused: boolean;
}
