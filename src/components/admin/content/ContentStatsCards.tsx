'use client';

import { BookOpen, CheckCircle2, Clock3, Package, Users, ShoppingBag } from 'lucide-react';
import type { CoursesStats, ProductsStats, ContentType } from './types';

type CardItem = {
  key: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  valueClass?: string;
};

function Card({ item }: { item: CardItem }) {
  const Icon = item.icon;
  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-1 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-[#FF5F57]" />
        <span className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
        <span className="h-2 w-2 rounded-full bg-[#28C840]" />
      </div>
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className={`font-[DM_Sans] text-[22px] font-extrabold ${item.valueClass || 'text-[#1D1D1F]'}`}>
            {item.value.toLocaleString()}
          </p>
          <p className="mt-1 text-[12px] text-[#6E6E73]">{item.label}</p>
        </div>
        <div className="rounded-xl bg-[#F5F5F7] p-2.5">
          <Icon className="h-4 w-4 text-[#6E6E73]" />
        </div>
      </div>
    </div>
  );
}

export default function ContentStatsCards({
  type,
  stats,
}: {
  type: ContentType;
  stats: CoursesStats | ProductsStats;
}) {
  const items: CardItem[] =
    type === 'course'
      ? [
          {
            key: 'total',
            label: 'Total Courses',
            value: (stats as CoursesStats).totalCourses,
            icon: BookOpen,
          },
          {
            key: 'pending',
            label: 'Pending Review',
            value: (stats as CoursesStats).pendingCourses,
            icon: Clock3,
            valueClass: (stats as CoursesStats).pendingCourses > 0 ? 'text-[#FEBC2E]' : 'text-[#1D1D1F]',
          },
          {
            key: 'live',
            label: 'Live Courses',
            value: (stats as CoursesStats).approvedCourses,
            icon: CheckCircle2,
            valueClass: 'text-[#28C840]',
          },
          {
            key: 'enrolled',
            label: 'Total Enrollments',
            value: (stats as CoursesStats).totalEnrollments,
            icon: Users,
          },
        ]
      : [
          {
            key: 'total',
            label: 'Total Products',
            value: (stats as ProductsStats).totalProducts,
            icon: Package,
          },
          {
            key: 'pending',
            label: 'Pending Review',
            value: (stats as ProductsStats).pendingProducts,
            icon: Clock3,
            valueClass: (stats as ProductsStats).pendingProducts > 0 ? 'text-[#FEBC2E]' : 'text-[#1D1D1F]',
          },
          {
            key: 'live',
            label: 'Live Products',
            value: (stats as ProductsStats).activeProducts,
            icon: CheckCircle2,
            valueClass: 'text-[#28C840]',
          },
          {
            key: 'sold',
            label: 'Total Units Sold',
            value: (stats as ProductsStats).totalUnitsSold,
            icon: ShoppingBag,
          },
        ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.key} item={item} />
      ))}
    </div>
  );
}
