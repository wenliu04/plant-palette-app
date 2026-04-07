function FilterPanel({
  selectedHoa,
  setSelectedHoa,
  filters,
  handleFilterChange,
  hoaOptions,
  plantTypeOptions,
  flowerColorOptions,
  bloomSeasonOptions,
  formatLabel,
}) {
  return (
    /* Left Panel */
    <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="text-lg font-semibold">Filters</h2>

            <div className="mt-4 space-y-4">
                 <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        HOA
                    </label>
                    <select
                        value={selectedHoa}
                        onChange={(e) => setSelectedHoa(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">All Communities</option>
                        {hoaOptions.map((hoa) => (
                            <option key={hoa} value={hoa}>
                                {hoa}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Plant Type
                    </label>
                    <select
                        value={filters.plantType}
                        onChange={(e) => handleFilterChange("plantType", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">All Types</option>
                        {plantTypeOptions.map((type) => (
                            <option key={type} value={type}>
                                {formatLabel(type)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Flower Color
                    </label>
                    <select
                        value={filters.flowerColor}
                        onChange={(e) => handleFilterChange("flowerColor", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">All Colors</option>
                        {flowerColorOptions.map((color) => (
                            <option key={color} value={color}>
                                {formatLabel(color)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Bloom Season
                    </label>
                    <select
                        value={filters.bloomSeason}
                        onChange={(e) => handleFilterChange("bloomSeason", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">All Seasons</option>
                        {bloomSeasonOptions.map((season) => (
                            <option key={season} value={season}>
                                {formatLabel(season)}
                            </option>
                        ))}
                    </select>
                </div>             
            </div>
          </aside>
    );
}

export default FilterPanel;