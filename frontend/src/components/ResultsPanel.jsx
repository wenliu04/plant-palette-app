function ResultsPanel({
  loading,
  filteredPlants,
  handleAddToPalette,
}) {
  return (
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
  );
}

export default ResultsPanel;