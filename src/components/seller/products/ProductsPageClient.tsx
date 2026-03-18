'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Plus, Upload, Search, LayoutGrid, List, AlertTriangle, 
  TrendingUp, Package, MoreHorizontal, Pencil 
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import TrafficLights from '@/components/auth/TrafficLights';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

import ProductStatsCards from './ProductStatsCards';
import ProductRow from './ProductRow';
import BulkActionsBar from './BulkActionsBar';
import StockUpdateModal from './StockUpdateModal';

interface ProductsPageClientProps {
  initialProducts: any[];
  categories: any[];
  stats: any;
  userId: string;
}

export default function ProductsPageClient({ initialProducts, categories, stats, userId }: ProductsPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const initialFilter = searchParams.get('filter') || 'All'; // e.g. 'low-stock' from dashboard

  const [products, setProducts] = useState(initialProducts);
  const [activeTab, setActiveTab] = useState(initialFilter === 'low-stock' ? 'Low Stock' : 'All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stockModalProduct, setStockModalProduct] = useState<any | null>(null);

  // Tabs logic
  const TABS = ['All', 'Active', 'Pending', 'Draft', 'Low Stock', 'Out of Stock'];

  // Filtering & Sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Tab Filter
    if (activeTab === 'Active') result = result.filter(p => p.status === 'active');
    if (activeTab === 'Pending') result = result.filter(p => p.status === 'pending');
    if (activeTab === 'Draft') result = result.filter(p => p.status === 'draft');
    if (activeTab === 'Low Stock') result = result.filter(p => p.stock_qty > 0 && p.stock_qty <= (p.low_stock_threshold || 5));
    if (activeTab === 'Out of Stock') result = result.filter(p => p.stock_qty === 0);

    // 2. Category Filter
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.product_categories?.id === categoryFilter);
    }

    // 3. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name?.toLowerCase().includes(q) || 
        p.product_categories?.name?.toLowerCase().includes(q)
      );
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortOption === 'best_selling') return b.total_sold - a.total_sold;
      if (sortOption === 'price_asc') return (a.discounted_price || a.price) - (b.discounted_price || b.price);
      if (sortOption === 'price_desc') return (b.discounted_price || b.price) - (a.discounted_price || a.price);
      if (sortOption === 'stock_asc') return a.stock_qty - b.stock_qty;
      return 0;
    });

    return result;
  }, [products, activeTab, categoryFilter, searchQuery, sortOption]);

  // Selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Handlers for rows
  const handleDuplicate = async (product: any) => {
    const toastId = toast.loading('Duplicating product...');
    const { id, created_at, updated_at, total_sold, avg_rating, total_reviews, product_categories, ...fields } = product;
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...fields,
        slug: (fields.slug || '') + '-copy',
        total_sold: 0,
        avg_rating: 0,
        total_reviews: 0,
        status: 'pending',
        seller_id: userId,
      })
      .select('*')
      .single();

    if (error) {
      toast.error('Failed to duplicate product', { id: toastId });
    } else {
      setProducts(prev => [{ ...data, product_categories: product.product_categories }, ...prev]);
      toast.success('Product duplicated!', { id: toastId });
    }
  };

  const handleDeleteRequest = async (product: any) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) return;
    const toastId = toast.loading('Deleting product...');
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id)
      .eq('seller_id', userId);

    if (error) {
      toast.error('Failed to delete product', { id: toastId });
    } else {
      setProducts(prev => prev.filter(p => p.id !== product.id));
      toast.success('Product deleted!', { id: toastId });
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  };

  const handleRefresh = () => {
    // Ideally router.refresh() or fetch from DB. 
    // Since we handle state optimistically for bulk, we'll just clear selection.
    router.refresh(); 
  };

  return (
    <div className="mx-auto max-w-6xl pb-24">
      
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[DM_Sans] text-[26px] font-bold text-[#1D1D1F]">Products</h1>
          <p className="mt-1 text-[13px] text-[#6E6E73]">{stats.totalProducts} products in your store</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => toast.info('CSV Import coming soon')}
            className="flex items-center rounded-full border border-[rgba(0,0,0,0.1)] px-4 py-2 font-[DM_Sans] text-[13px] font-medium text-[#1D1D1F] transition-colors hover:bg-[#F5F5F7]"
          >
            <Upload className="mr-2 h-[13px] w-[13px]" />
            Import CSV
          </button>
          <button
            onClick={() => router.push('/seller/products/new')}
            className="flex items-center rounded-full bg-[#1D1D1F] px-5 py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="mr-2 h-[14px] w-[14px]" />
            Add Product
          </button>
        </div>
      </div>

      {/* STATS */}
      <ProductStatsCards stats={stats} />

      {/* FILTER + SEARCH ROW */}
      <div className="mb-5 flex flex-wrap items-center gap-4 border-b border-[rgba(0,0,0,0.06)] pb-4">
        
        {/* TABS */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab: string) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedIds([]); }}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 font-[DM_Sans] text-[13px] font-semibold transition-colors ${
                activeTab === tab 
                  ? 'bg-[#1D1D1F] text-white' 
                  : 'text-[#6E6E73] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {/* Category Select */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] rounded-xl border-none bg-white text-[13px] shadow-sm">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[rgba(0,0,0,0.08)]">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-[180px] rounded-xl border-none bg-white text-[13px] shadow-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[rgba(0,0,0,0.08)]">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="best_selling">Best Selling</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="stock_asc">Stock: Low to High</SelectItem>
            </SelectContent>
          </Select>

          {/* Search Input */}
          <div className="relative w-[220px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#AEAEB2]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-[#F5F5F7] py-2 pl-9 pr-4 text-[13px] text-[#1D1D1F] placeholder:text-[#AEAEB2] focus:outline-none focus:ring-1 focus:ring-[rgba(0,0,0,0.15)]"
            />
          </div>

          {/* View Toggle */}
          <div className="flex shrink-0 items-center justify-center gap-1 rounded-xl bg-white p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-[#1D1D1F] text-white' : 'text-[#AEAEB2] hover:bg-[#F5F5F7]'}`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-1.5 transition-colors ${viewMode === 'list' ? 'bg-[#1D1D1F] text-white' : 'text-[#AEAEB2] hover:bg-[#F5F5F7]'}`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white py-24 shadow-sm relative">
          <div className="absolute top-4 left-4">
            <TrafficLights size="sm" />
          </div>
          <Package className="h-12 w-12 text-[#AEAEB2]" />
          <h3 className="mt-5 font-[DM_Sans] text-[22px] font-bold text-[#1D1D1F]">No products yet</h3>
          <p className="mt-2 text-[14px] text-[#6E6E73]">
            Add your first product and start selling to the Slate community.
          </p>
          <button
            onClick={() => router.push('/seller/products/new')}
            className="mt-8 rounded-full bg-[#1D1D1F] px-6 py-2.5 font-[DM_Sans] text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            + Add Product
          </button>
        </div>
      ) : viewMode === 'list' ? (
        
        // TABLE VIEW
        <div className="overflow-x-auto rounded-2xl border border-[rgba(0,0,0,0.08)] bg-white shadow-sm">
          {/* Titlebar */}
          <div className="flex h-11 min-w-[900px] items-center border-b border-[rgba(0,0,0,0.06)] bg-[#F5F5F7] px-5">
            <TrafficLights size="sm" />
            <span className="ml-3 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
              {activeTab} Products ({filteredProducts.length})
            </span>
          </div>

          {/* Header */}
          <div className="grid min-w-[900px] grid-cols-[40px_minmax(200px,1.5fr)_minmax(120px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_80px_100px] items-center gap-4 border-b border-[rgba(0,0,0,0.05)] bg-[#F5F5F7] px-5 py-3">
            <Checkbox 
              checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0} 
              onCheckedChange={toggleSelectAll} 
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Product</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Category</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Price</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Stock</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Sales</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Status</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEAEB2]">Actions</span>
          </div>

          {/* Rows */}
          <div className="flex min-w-[900px] flex-col">
            {filteredProducts.map(p => (
              <ProductRow 
                key={p.id}
                product={p}
                isSelected={selectedIds.includes(p.id)}
                onToggleSelect={toggleSelect}
                onDuplicate={handleDuplicate}
                onDeleteRequest={handleDeleteRequest}
                onStatusChange={handleStatusChange}
                onOpenStockModal={setStockModalProduct}
              />
            ))}
          </div>
        </div>
      ) : (

        // GRID VIEW
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map(p => {
            const isSelected = selectedIds.includes(p.id);
            const isLowStock = p.stock_qty <= (p.low_stock_threshold || 5);
            const isOut = p.stock_qty === 0;

            return (
              <div 
                key={p.id}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-1 ${
                  isSelected ? 'border-[#1D1D1F] ring-1 ring-[#1D1D1F]' : 'border-[rgba(0,0,0,0.08)] hover:shadow-md'
                }`}
                onClick={() => router.push(`/seller/products/${p.id}/edit`)}
              >
                {/* Titlebar */}
                <div className="flex h-8 items-center justify-between border-b border-[rgba(0,0,0,0.05)] bg-[#F5F5F7] px-3">
                  <TrafficLights size="sm" />
                  <div onClick={e => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(p.id)} />
                  </div>
                </div>

                {/* Image */}
                <div className="relative aspect-square w-full bg-[#F5F5F7]">
                  <img src={p.images?.[0] || 'https://via.placeholder.com/300'} alt="" className="h-full w-full object-cover" />
                  
                  {/* Stock Badge */}
                  <div className="absolute bottom-2 left-0 flex items-center">
                    {isOut ? (
                      <span className="rounded-r-lg bg-[#FF5F57] px-2 py-1 font-[DM_Sans] text-[10px] font-bold text-white shadow-sm">
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="rounded-r-lg bg-[#FEBC2E] px-2 py-1 font-[DM_Sans] text-[10px] font-bold text-[#1D1D1F] shadow-sm">
                        Low: {p.stock_qty} left
                      </span>
                    ) : null}
                  </div>

                  {/* Status Badge */}
                  <div className="absolute right-2 top-2">
                    {p.status === 'active' ? (
                      <span className="rounded-lg bg-[#EDFAF0] px-2 py-1 font-[DM_Sans] text-[10px] font-bold text-[#28C840] shadow-sm">
                        Active
                      </span>
                    ) : p.status === 'pending' ? (
                      <span className="rounded-lg bg-[#FFFBF2] px-2 py-1 font-[DM_Sans] text-[10px] font-bold text-[#FEBC2E] shadow-sm">
                        Pending
                      </span>
                    ) : p.status === 'draft' ? (
                      <span className="rounded-lg bg-[#F5F5F7] px-2 py-1 font-[DM_Sans] text-[10px] font-bold text-[#AEAEB2]">
                        Draft
                      </span>
                    ) : null}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-[rgba(0,0,0,0.5)] opacity-0 transition-opacity group-hover:opacity-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/seller/products/${p.id}/edit`); }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1D1D1F] transition-transform hover:scale-105 shadow-md"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setStockModalProduct(p); }}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1D1D1F] transition-transform hover:scale-105 shadow-md"
                      title="Update Stock"
                    >
                      <Package className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#AEAEB2]">
                    {p.product_categories?.name || 'Category'}
                  </p>
                  <p className="mt-0.5 line-clamp-2 font-[DM_Sans] text-[13px] font-semibold text-[#1D1D1F]">
                    {p.name}
                  </p>
                  
                  <div className="mt-2 flex items-center gap-1.5">
                    {p.discounted_price ? (
                      <>
                        <span className="font-[DM_Sans] text-[13px] font-bold text-[#1D1D1F]">₹{p.discounted_price}</span>
                        <span className="text-[11px] font-medium text-[#AEAEB2] line-through">₹{p.price}</span>
                      </>
                    ) : (
                      <span className="font-[DM_Sans] text-[13px] font-bold text-[#1D1D1F]">₹{p.price}</span>
                    )}
                  </div>

                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#6E6E73]">
                      <Package className="h-3 w-3 text-[#AEAEB2]" />
                      {p.stock_qty} left
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#6E6E73]">
                      <TrendingUp className="h-3 w-3 text-[#AEAEB2]" />
                      {p.total_sold} sold
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar 
        selectedIds={selectedIds} 
        userId={userId} 
        onClear={() => setSelectedIds([])} 
        onSuccess={handleRefresh} 
      />

      {/* Quick Stock Update Modal */}
      <StockUpdateModal
        isOpen={!!stockModalProduct}
        product={stockModalProduct}
        onClose={() => setStockModalProduct(null)}
        onSuccess={(newQty: number, newThreshold: number) => {
          if (stockModalProduct) {
            setProducts(prev => prev.map(p =>
              p.id === stockModalProduct.id
                ? { ...p, stock_qty: newQty, low_stock_threshold: newThreshold }
                : p
            ));
          }
        }}
      />

    </div>
  );
}
