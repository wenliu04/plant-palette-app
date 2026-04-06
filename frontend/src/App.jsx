import { useEffect, useMemo,useState } from "react";

function App() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlants, setSelectedPlants] = useState([]);

  const [filters, setFilters] = useState({
    hoa: "",
    plantType: "",
    flowerColor: "",
    bloomSeason: "",
  });

  useEffect(() => {
    fetch("http://localhost:8000/plants")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Plants loaded:", data);
        setPlants(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching plant data:", err);
        setLoading(false);
      });
  }, []);

  const handleAddToPalette = (plant) => {
    const alreadySelected = selectedPlants.some((p) => p.id === plant.id);
    if (!alreadySelected) {
      setSelectedPlants([...selectedPlants, plant]);
    }
  };

  const handleRemoveFromPalette = (plantId) => {
    setSelectedPlants(selectedPlants.filter((plant) => plant.id !== plantId));
  };

   const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const hoaOptions = useMemo(() => {
  return [...new Set(plants.map((plant) => plant.hoa).filter(Boolean))];
}, [plants]);

  const plantTypeOptions = useMemo(() => {
    return [...new Set(plants.map((plant) => plant.plant_type).filter(Boolean))];
  }, [plants]);

  const flowerColorOptions = useMemo(() => {
    return [...new Set(plants.map((plant) => plant.flower_color).filter(Boolean))];
  }, [plants]);

  const bloomSeasonOptions = useMemo(() => {
    return [...new Set(plants.map((plant) => plant.bloom_season).filter(Boolean))];
  }, [plants]);


  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const matchesHoa = !filters.hoa || plant.hoa === filters.hoa;
      const matchesType =
        !filters.plantType || plant.plant_type === filters.plantType;
      const matchesColor =
        !filters.flowerColor || plant.flower_color === filters.flowerColor;

      return matchesHoa && matchesType && matchesColor;
    });
  }, [plants, filters]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Plant Palette Tool</h1>
          <p className="mt-2 text-sm text-gray-600">
            Version 1 – Filter / Results / Palette layout
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Panel */}
          <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="text-lg font-semibold">Filters</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  HOA
                </label>
                <select
                value={filters.hoa}
                  onChange={(e) =>
                    handleFilterChange("hoa", e.target.value)
                  }
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
                  onChange={(e) =>
                    handleFilterChange("plantType", e.target.value)
                  }
                 className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">All Types</option>
                  {plantTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
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
                  onChange={(e) =>
                    handleFilterChange("flowerColor", e.target.value)
                  }
                   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">All Colors</option>
                  「{flowerColorOptions.map((color) => (
                      <option key={color} value={color}>
                        {color}
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
                  onChange={(e) =>
                    handleFilterChange("bloomSeason", e.target.value)
                  }
                   className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">All Seasons</option>
                  {bloomSeasonOptions.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>

          {/* Middle Panel */}
          <main className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Plant Results</h2>
              <p className="text-sm text-gray-500">
                {loading ? "Loading..." : `${filteredPlants.length} plants`}
              </p>
            </div>

            {loading ? (
              <p className="text-gray-500">Loading plant results...</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredPlants.map((plant) => (
                  <div
                    key={plant.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <img
                      src={plant.image_url}
                      alt={plant.common_name}
                      className="h-40 w-full object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold">
                        {plant.common_name}
                      </h3>
                      <p className="text-sm italic text-gray-500">
                        {plant.botanical_name}
                      </p>

                      <div className="mt-3 space-y-1 text-sm text-gray-700">
                        <p>Type: {plant.plant_type}</p>
                        <p>Flower Color: {plant.flower_color}</p>
                        <p>Height: {plant.height}</p>
                      </div>

                      <button
                        onClick={() => handleAddToPalette(plant)}
                        className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Add to Palette
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* Right Panel */}
          <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Palette</h2>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                {selectedPlants.length} selected
              </span>
            </div>

            {selectedPlants.length === 0 ? (
              <p className="text-sm text-gray-500">
                No plants selected yet.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedPlants.map((plant) => (
                  <div
                    key={plant.id}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 p-3"
                  >
                    <img
                      src={plant.image_url}
                      alt={plant.common_name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{plant.common_name}</p>
                      <p className="text-xs italic text-gray-500">
                        {plant.botanical_name}
                      </p>
                      <button
                        onClick={() => handleRemoveFromPalette(plant.id)}
                        className="mt-2 text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              Generate Board
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default App;