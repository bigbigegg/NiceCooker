import { create } from 'zustand';
import type { CustomerInstance, CustomerVisitRecord, CustomerTypeId } from '@/types/customer';

interface CustomerState {
  /** 当前店内顾客，key = customerId */
  customers: Record<string, CustomerInstance>;
  /** 顾客来访记录，key = 类型ID */
  visitRecords: Record<CustomerTypeId, CustomerVisitRecord>;

  // Actions
  /** 添加顾客到店内 */
  addCustomer: (customer: CustomerInstance) => void;
  /** 更新顾客状态（部分字段） */
  updateCustomer: (customerId: string, updates: Partial<CustomerInstance>) => void;
  /** 移除顾客（离店） */
  removeCustomer: (customerId: string) => void;
  /** 标记顾客已服务 */
  markServed: (customerId: string, quality: number) => void;
  /** 更新来访记录 */
  updateVisitRecord: (typeId: CustomerTypeId, spending: number, day: number) => void;
  /** 获取指定类型的来访次数 */
  getVisitCount: (typeId: CustomerTypeId) => number;
  /** 获取当前店内顾客数量 */
  getCustomerCount: () => number;
}

/**
 * 顾客状态管理 Store
 *
 * 管理店内所有顾客实例和来访记录。
 * 顾客生成、状态机更新等逻辑在 CustomerSystem 中处理。
 */
export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: {},
  visitRecords: {} as Record<CustomerTypeId, CustomerVisitRecord>,

  addCustomer: (customer) => {
    set((s) => ({
      customers: { ...s.customers, [customer.id]: customer },
    }));
  },

  updateCustomer: (customerId, updates) => {
    set((s) => {
      const existing = s.customers[customerId];
      if (!existing) return s;
      return {
        customers: {
          ...s.customers,
          [customerId]: { ...existing, ...updates },
        },
      };
    });
  },

  removeCustomer: (customerId) => {
    set((s) => {
      const { [customerId]: _removed, ...rest } = s.customers;
      return { customers: rest };
    });
  },

  markServed: (customerId, quality) => {
    set((s) => {
      const existing = s.customers[customerId];
      if (!existing) return s;
      return {
        customers: {
          ...s.customers,
          [customerId]: {
            ...existing,
            isServed: true,
            servedQuality: quality,
          },
        },
      };
    });
  },

  updateVisitRecord: (typeId, spending, day) => {
    set((s) => {
      const existing = s.visitRecords[typeId];
      const record: CustomerVisitRecord = existing
        ? {
            ...existing,
            visitCount: existing.visitCount + 1,
            totalSpending: existing.totalSpending + spending,
            lastVisitDay: day,
          }
        : {
            typeId,
            visitCount: 1,
            totalSpending: spending,
            lastVisitDay: day,
          };
      return {
        visitRecords: { ...s.visitRecords, [typeId]: record },
      };
    });
  },

  getVisitCount: (typeId) => {
    return get().visitRecords[typeId]?.visitCount ?? 0;
  },

  getCustomerCount: () => {
    return Object.keys(get().customers).length;
  },
}));
