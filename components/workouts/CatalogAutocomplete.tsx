"use client";

import { useState, useEffect, useRef } from "react";

type CatalogItem = {
  id: string;
  name: string;
};

type Props = {
  endpoint: string;
  placeholder: string;
  onSelect: (item: CatalogItem) => void;
};

export function CatalogAutocomplete({ endpoint, placeholder, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      const res = await fetch(`${endpoint}?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, endpoint]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      {isOpen && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {results.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                onSelect(item);
                setQuery(item.name);
                setIsOpen(false);
              }}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-100"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
