import { useNavigate } from "react-router-dom";

function PalettePanel({
  selectedPlants,
  handleRemoveFromPalette,
}) {
    const navigate = useNavigate();
    const handleGenerateBoard = () => {
    localStorage.setItem("paletteBoard", JSON.stringify(selectedPlants));
    navigate("/board");
  };
  return (
    
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
        onClick={handleGenerateBoard}
        disabled={selectedPlants.length === 0}
        className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
        Generate Board
      </button>
    </aside>
  );
}

export default PalettePanel;