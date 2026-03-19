'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Clock,
  Search,
  Users,
  BookOpen,
  Package,
  ShoppingBag,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import TrafficLights from '@/components/auth/TrafficLights';

/* ─── Search Result Types ─── */
interface SearchResult {
  id: string;
  type: 'user' | 'course' | 'product' | 'order';
  title: string;
  subtitle?: string;
  url: string;
}

interface AdminTopbarProps {
  userId: string;
  pendingCounts: {
    users: number;
    courses: number;
    products: number;
  };
}

export default function AdminTopbar({ userId, pendingCounts }: AdminTopbarProps) {
  const router = useRouter();
  const supabase = createClient();

  // ── Search State ──
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Close search dropdown on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Debounced search handler ──
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowSearch(false);
      return;
    }

    setSearching(true);
    setShowSearch(true);

    const timeoutId = setTimeout(async () => {
      try {
        // Parallel search across multiple tables
        const [usersRes, coursesRes, productsRes, ordersRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, email, role, status')
            .ilike('full_name', `%${query}%`)
            .limit(5),
          supabase
            .from('courses')
            .select('id, title, status')
            .ilike('title', `%${query}%`)
            .limit(5),
          supabase
            .from('products')
            .select('id, name, status')
            .ilike('name', `%${query}%`)
            .limit(5),
          supabase
            .from('orders')
            .select('id, order_number, status')
            .ilike('order_number', `%${query}%`)
            .limit(3),
        ]);

        const searchResults: SearchResult[] = [];

        // Users
        if (usersRes.data) {
          usersRes.data.forEach((u) => {
            searchResults.push({
              id: u.id,
              type: 'user',
              title: u.full_name || 'Unnamed User',
              subtitle: `${u.role} · ${u.status}`,
              url: `/admin/users/${u.id}`,
            });
          });
        }

        // Courses
        if (coursesRes.data) {
          coursesRes.data.forEach((c) => {
            searchResults.push({
              id: c.id,
              type: 'course',
              title: c.title,
              subtitle: `Status: ${c.status}`,
              url: `/admin/courses/${c.id}`,
            });
          });
        }

        // Products
        if (productsRes.data) {
          productsRes.data.forEach((p) => {
            searchResults.push({
              id: p.id,
              type: 'product',
              title: p.name,
              subtitle: `Status: ${p.status}`,
              url: `/admin/products/${p.id}`,
            });
          });
        }

        // Orders
        if (ordersRes.data) {
          ordersRes.data.forEach((o) => {
            searchResults.push({
              id: o.id,
              type: 'order',
              title: o.order_number,
              subtitle: `Status: ${o.status}`,
              url: `/admin/orders/${o.id}`,
            });
          });
        }

        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearching(false);
      }
    }, 250); // 250ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, supabase]);

  const handleResultClick = (url: string) => {
    router.push(url);
    setQuery('');
    setShowSearch(false);
  };

  const totalPending = pendingCounts.users + pendingCounts.courses + pendingCounts.products;

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="h-4 w-4 shrink-0 text-[#1D1D1F]" />;
      case 'course':
        return <BookOpen className="h-4 w-4 shrink-0 text-[#3B82F6]" />;
      case 'product':
        return <Package className="h-4 w-4 shrink-0 text-[#28C840]" />;
      case 'order':
        return <ShoppingBag className="h-4 w-4 shrink-0 text-[#FEBC2E]" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-16 items-center justify-between border-b border-[rgba(0,0,0,0.08)] bg-white px-6">
      {/* Left: Traffic Lights */}
      <div className="flex items-center gap-4">
        <TrafficLights size="xs" />
      </div>

      {/* Center: Global Search */}
      <div className="relative flex-1 max-w-md mx-4" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#AEAEB2]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, courses, orders..."
            className="h-10 w-full rounded-xl border-none bg-[#F5F5F7] pl-11 pr-12 font-[DM_Sans] text-[13px] text-[#1D1D1F] placeholder-[#AEAEB2] outline-none transition-all focus:bg-white focus:shadow-md"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#AEAEB2] hover:text-[#1D1D1F]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded bg-[rgba(0,0,0,0.06)] px-1.5 py-0.5 font-[DM_Sans] text-[10px] text-[#AEAEB2]">
            ⌘K
          </span>
        </div>

        {/* Search Results Dropdown */}
        {showSearch && (
          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[400px] overflow-y-auto rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            {/* Mac titlebar */}
            <div className="flex h-[44px] items-center gap-3 border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-4">
              <TrafficLights size="xs" />
              <span className="font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                Search Results
              </span>
            </div>

            <div className="p-2">
              {searching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1D1D1F] border-t-transparent"></div>
                </div>
              ) : results.length > 0 ? (
                results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result.url)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-[#F5F5F7]"
                  >
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F] truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-[11px] text-[#AEAEB2] truncate">{result.subtitle}</p>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="font-[DM_Sans] text-[13px] text-[#AEAEB2]">No results found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: Alerts Bell + Pending Button */}
      <div className="flex items-center gap-3">
        {/* Alert Bell (placeholder for future) */}
        <button className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-[#F5F5F7]">
          <Bell className="h-5 w-5 text-[#6E6E73]" />
        </button>

        {/* Pending Approvals Button */}
        {totalPending > 0 && (
          <button
            onClick={() => router.push('/admin/users?status=pending')}
            className="flex items-center gap-2 rounded-full bg-[#FF5F57] px-4 py-2 transition-all hover:bg-[#FF5F57]/90"
          >
            <Clock className="h-3.5 w-3.5 text-white" />
            <span className="font-[DM_Sans] text-[12px] font-semibold text-white">
              {totalPending} Pending
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
