function FilterPanel({
  selectedHoa,
  setSelectedHoa,
  filters,
  handleFilterChange,
  hoaOptions,
  plantTypeOptions,
  flowerColorOptions,
  bloomSeasonOptions,
  sunExposureOptions,
  shadeOptions,
  leafColorOptions,
  foliageTypeOptions,
  formatLabel,
}) {
  const isBotanicalSearch = filters.searchField === "botanical";

  return (
    /* Left Panel */
    <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="text-lg font-semibold">Filters</h2>

            <div className="mt-4 space-y-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Search In
                    </label>
                    <div className="space-y-2 rounded-lg bg-gray-50 p-2">
                        <label
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-white"
                            onClick={() => handleFilterChange("searchField", "common")}
                        >
                            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                                filters.searchField === "common" ? "border-gray-700" : "border-gray-400"
                            }`}>
                                <span className={`h-2 w-2 rounded-full ${
                                    filters.searchField === "common" ? "bg-gray-700" : "bg-transparent"
                                }`} />
                            </span>
                            <span>Common Name</span>
                        </label>

                        <label
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-white"
                            onClick={() => handleFilterChange("searchField", "botanical")}
                        >
                            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                                filters.searchField === "botanical" ? "border-gray-700" : "border-gray-400"
                            }`}>
                                <span className={`h-2 w-2 rounded-full ${
                                    filters.searchField === "botanical" ? "bg-gray-700" : "bg-transparent"
                                }`} />
                            </span>
                            <span>Botanical Name</span>
                        </label>
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Search
                    </label>
                    <input
                        type="text"
                        value={filters.searchText}
                        onChange={(e) => handleFilterChange("searchText", e.target.value)}
                        placeholder={isBotanicalSearch ? "Search botanical name..." : "Search common name..."}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                </div>
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

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Sun Exposure
                    </label>
                    <select
                        value={filters.sunExposure}
                        onChange={(e) => handleFilterChange("sunExposure", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">All Sun Levels</option>
                        {sunExposureOptions.map((sun) => (
                            <option key={sun} value={sun}>
                                {formatLabel(sun)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Shade
                    </label>
                    <select
                        value={filters.shade}
                        onChange={(e) => handleFilterChange("shade", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">All Shade Levels</option>
                        {shadeOptions.map((shade) => (
                            <option key={shade} value={shade}>
                                {formatLabel(shade)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Leaf Color
                    </label>
                    <select
                        value={filters.leafColor}
                        onChange={(e) => handleFilterChange("leafColor", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">All Leaf Colors</option>
                        {leafColorOptions.map((leafColor) => (
                            <option key={leafColor} value={leafColor}>
                                {formatLabel(leafColor)}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                        Foliage Type
                    </label>
                    <select
                        value={filters.foliageType}
                        onChange={(e) => handleFilterChange("foliageType", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                        <option value="">All Types</option>
                        {foliageTypeOptions.map((foliageType) => (
                            <option key={foliageType} value={foliageType}>
                                {formatLabel(foliageType)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
          </aside>
    );
}

export default FilterPanel;
