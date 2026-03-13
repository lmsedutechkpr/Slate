"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, BookOpen, ShoppingBag, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  type: "course" | "product";
  url: string;
  image?: string;
}

export default function LiveSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([]);
        return;
      }
      setIsLoading(true);

      const supabase = createClient();
      const searchTerm = `%${query}%`;

      try {
        const [coursesRes, productsRes] = await Promise.all([
          supabase
            .from("courses")
            .select("id, title, thumbnail_url")
            .eq("status", "approved")
            .ilike("title", searchTerm)
            .limit(3),
          supabase
            .from("products")
            .select("id, name, images")
            .eq("status", "active")
            .ilike("name", searchTerm)
            .limit(3),
        ]);

        const formattedCourses: SearchResult[] = (coursesRes.data || []).map((c) => ({
          id: c.id,
          title: c.title,
          type: "course",
          url: `/student/courses/browse/${c.id}`,
          image: c.thumbnail_url || undefined,
        }));

        const formattedProducts: SearchResult[] = (productsRes.data || []).map((p) => ({
          id: p.id,
          title: p.name,
          type: "product",
          url: `/student/shop/${p.id}`,
          image: Array.isArray(p.images) ? p.images[0] : undefined,
        }));

        setResults([...formattedCourses, ...formattedProducts]);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    router.push(url);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-1 items-center z-50">
      <div className="flex h-8 lg:h-9 w-full items-center rounded-full bg-gray-100 border border-gray-200 lg:w-[320px] px-3 transition-colors focus-within:bg-white focus-within:border-gray-300 focus-within:shadow-sm">
        <Search className="h-[14px] w-[14px] shrink-0 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.length > 1) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length > 1) setIsOpen(true);
          }}
          placeholder="Search courses, products..."
          className="h-full w-full bg-transparent px-2.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-400"
        />
        {isLoading && <Loader2 className="h-[14px] w-[14px] shrink-0 text-gray-400 animate-spin" />}
        {!isLoading && query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="text-gray-400 hover:text-gray-600">
            <X className="h-[14px] w-[14px] shrink-0" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query.length > 1 && (
        <div className="absolute top-12 left-0 w-[calc(100vw-48px)] lg:w-[400px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transform origin-top transition-all">
          <div className="max-h-[350px] overflow-y-auto">
            {results.length === 0 && !isLoading ? (
              <div className="p-4 text-center text-[13px] text-gray-500">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              <div className="py-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result.url)}
                    className="w-full text-left flex items-start gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    {result.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={result.image} alt={result.title} className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        {result.type === "course" ? (
                          <BookOpen className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="text-[13px] font-medium text-gray-900 truncate">{result.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{result.type}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {results.length > 0 && (
            <div className="p-2 border-t border-gray-50 bg-gray-50/50">
              <p className="text-[11px] text-center text-gray-400">Press ENTER for advanced search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
