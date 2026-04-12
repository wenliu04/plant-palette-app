function ResultsPanel({
  language,
  loading,
  filteredPlants,
  handleAddToPalette,
  formatLabel,
}) {
    const isZh = language === "zh";
    //根据 bloom season 返回对应的标签颜色
    // Return corresponding tag color based on bloom season
    const getSeasonTagClass = (season) => {
    switch (season) {
      case "Spring":
        return "bg-green-100 text-green-700";
      case "Summer":
        return "bg-yellow-100 text-yellow-700";
      case "Fall":
        return "bg-orange-100 text-orange-700";
      case "Winter":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  return (
    <main className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{isZh ? "植物结果" : "Plant Results"}</h2>
        <p className="text-sm text-gray-500">
          {loading ? (isZh ? "加载中..." : "Loading...") : `${filteredPlants.length} ${isZh ? "种植物" : "plants"}`}
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">{isZh ? "正在加载植物结果..." : "Loading plant results..."}</p>
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
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold">
                  {plant.common_name}
                </h3>
                <p className="text-sm italic text-gray-500">
                  {plant.botanical_name}
                </p>

                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p>{isZh ? "类型" : "Type"}: {formatLabel(plant.plant_type)}</p>
                  <p>{isZh ? "花色" : "Flower Color"}: {formatLabel(plant.flower_color)}</p>
                  <p>{isZh ? "高度" : "Height"}: {plant.height}</p>  
                </div>
                
                 {/* Bloom season tags / 花期标签 */}
                {plant.bloom_season && plant.bloom_season.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plant.bloom_season.map((season) => (
                      <span
                        key={season}
                        className={`rounded-full bg-green-100 px-2 py-1 text-xs font-medium ${getSeasonTagClass(season)}`}
                      >
                        {formatLabel(season)}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => handleAddToPalette(plant)}
                  className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  {isZh ? "加入 Palette" : "Add to Palette"}
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
