'use client';

import {create} from 'zustand';

type CartState = {
  count: number;
  increment: (by?: number) => void;
  decrement: () => void;
  setCount: (count: number) => void;
};

export const useCartStore = create<CartState>((set) => ({
  count: 0,
  increment: (by = 1) =>
    set((state) => ({
      count: Math.max(0, state.count + by)
    })),
  decrement: () =>
    set((state) => ({
      count: Math.max(0, state.count - 1)
    })),
  setCount: (count) =>
    set({
      count: Math.max(0, count)
    })
}));
