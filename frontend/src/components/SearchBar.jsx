import { Search, Filter, SortAsc, SortDesc } from 'lucide-react'

export default function SearchBar({
  search,
  category,
  sort,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Conferences
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Title or description..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="relative">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="category"
              type="text"
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              placeholder="Filter by category..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            Sort by Date
          </label>
          <div className="relative">
            {sort === 'asc' ? (
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            ) : (
              <SortDesc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <select
              id="sort"
              value={sort}
              onChange={(e) => onSortChange(e.target.value)}
              className="input pl-10 appearance-none"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(search || category) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full">
              Search: "{search}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:bg-primary-200 rounded-full p-0.5"
              >
                ×
              </button>
            </span>
          )}
          {category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-100 text-secondary-800 text-xs rounded-full">
              Category: "{category}"
              <button
                onClick={() => onCategoryChange('')}
                className="ml-1 hover:bg-secondary-200 rounded-full p-0.5"
              >
              ×
            </button>
          </span>
          )}
        </div>
      )}
    </div>
  )
}
