import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ItemCard } from "../components/ItemCard";
import { SearchFilters } from "../components/SearchFilters";

export function BrowseItems() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    size: "",
    condition: "",
  });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  // Use search if there's a search term, otherwise get all items
  const searchResults = useQuery(
    api.items.searchItems,
    searchTerm.trim() ? {
      searchTerm: searchTerm.trim(),
      category: filters.category as any || undefined,
      size: filters.size as any || undefined,
      condition: filters.condition as any || undefined,
    } : "skip"
  );

  const allItems = useQuery(
    api.items.getApprovedItems,
    !searchTerm.trim() ? {
      paginationOpts: {
        numItems: itemsPerPage,
        cursor: null,
      },
      category: filters.category as any || undefined,
      size: filters.size as any || undefined,
      condition: filters.condition as any || undefined,
    } : "skip"
  );

  const items = searchTerm.trim() ? searchResults : allItems?.page;
  const isLoading = searchTerm.trim() ? searchResults === undefined : allItems === undefined;

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(0);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            Discover Amazing Pre-Loved Fashion
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse thousands of quality items from our community. Find your next favorite piece 
            while helping the planet!
          </p>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          filters={filters}
          onSearchChange={handleSearch}
          onFilterChange={handleFilterChange}
        />

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-gray-600">
                {items?.length || 0} items found
                {searchTerm && (
                  <span className="ml-2">
                    for "<span className="font-medium">{searchTerm}</span>"
                  </span>
                )}
              </p>
            </div>

            {/* Items Grid */}
            {items && items.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <ItemCard key={item._id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No items found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or filters
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilters({ category: "", size: "", condition: "" });
                  }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
