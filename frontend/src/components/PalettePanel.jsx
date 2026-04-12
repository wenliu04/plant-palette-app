import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TYPE_ORDER = ["Tree", "Shrub", "Grass", "Groundcover", "Perennial", "Succulent", "Vine"];

const formatTypeLabel = (value) => {
  if (!value) return "Other";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const groupPlantsByType = (plants) => {
  const grouped = plants.reduce((acc, plant) => {
    const rawType = plant.plant_type || "Other";
    const type = formatTypeLabel(rawType);
    if (!acc[type]) acc[type] = [];
    acc[type].push(plant);
    return acc;
  }, {});

  const groups = Object.entries(grouped);
  groups.sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a[0]);
    const bi = TYPE_ORDER.indexOf(b[0]);
    if (ai === -1 && bi === -1) return a[0].localeCompare(b[0]);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return groups;
};

// PalettePanel 组件 / PalettePanel component
// 用于展示已选植物列表，并支持移除与生成展示板。
// Displays selected plants, supports removing items, and generates a board view.
function PalettePanel({
  language,
  // 已选植物数组。
  // Array of currently selected plants.
  selectedPlants,
  // 从调色板中移除植物的回调函数（由父组件传入）。
  // Callback from parent to remove a plant from the palette.
  handleRemoveFromPalette,
  // 清空整个调色板的回调函数。
  // Callback to clear all plants from the palette.
  handleRemoveAllFromPalette,
  handleImportPlantFile,
  importStatus,
}) {
  const isZh = language === "zh";
  // React Router 导航函数，用于页面跳转。
  // Navigation helper from React Router for route transitions.
  const navigate = useNavigate();
  const [groupByType, setGroupByType] = useState(false);

  // 生成 Board 的处理函数：
  // 1) 将当前选中的植物写入 localStorage；
  // 2) 跳转到 /board 页面。
  // Handler to generate board:
  // 1) Save selected plants to localStorage;
  // 2) Navigate to the /board route.
  const handleGenerateBoard = () => {
    localStorage.setItem("paletteBoard", JSON.stringify(selectedPlants));
    navigate("/board");
  };
  const groupedPlants = groupPlantsByType(selectedPlants);

  // 组件 UI：
  // - 头部显示标题和已选数量；
  // - 无数据时显示空状态提示；
  // - 有数据时渲染植物卡片列表；
  // - 底部按钮用于生成 Board（无选择时禁用）。
  // Component UI:
  // - Header shows title and selected count;
  // - Empty state when no plants are selected;
  // - List of plant cards when data exists;
  // - Bottom action button generates board (disabled when empty).
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:col-span-4">
      {/* 标题与计数区域 / Title and selection count */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Palette</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupByType((prev) => !prev)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              groupByType
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {isZh ? "按类型分组" : "Group by Type"}
          </button>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
            {selectedPlants.length} {isZh ? "已选择" : "selected"}
          </span>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          {isZh ? "导入清单" : "Import List"}
          <input
            type="file"
            accept=".txt,.csv,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                await handleImportPlantFile(file);
              }
              e.target.value = "";
            }}
          />
        </label>
        <button
          onClick={handleRemoveAllFromPalette}
          disabled={selectedPlants.length === 0}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isZh ? "全部移除" : "Remove All"}
        </button>
      </div>
      {importStatus ? (
        <p className="mb-3 text-xs text-gray-600">{importStatus}</p>
      ) : null}

      {/* 空状态：当未选择任何植物时显示 / Empty state: shown when no plant is selected */}
      {selectedPlants.length === 0 ? (
        <p className="text-sm text-gray-500">
          {isZh ? "还没有选择植物。" : "No plants selected yet."}
        </p>
      ) : (
        // 列表状态：逐项渲染已选植物卡片。
        // List state: render each selected plant as a card.
        <div className="space-y-4">
          {groupByType ? (
            groupedPlants.map(([type, plants]) => (
              <div key={type}>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                  {type} ({plants.length})
                </h3>
                <div className="space-y-3">
                  {plants.map((plant) => (
                    <div
                      key={plant.id}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 p-3"
                    >
                      {/* 植物缩略图 / Plant thumbnail */}
                      <img
                        src={plant.image_url}
                        alt={plant.common_name}
                        loading="lazy"
                        decoding="async"
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        {/* 常见名 / Common name */}
                        <p className="font-medium">{plant.common_name}</p>
                        {/* 学名 / Botanical name */}
                        <p className="text-xs italic text-gray-500">
                          {plant.botanical_name}
                        </p>
                        {/* 点击后从调色板移除当前植物 / Remove current plant from palette */}
                        <button
                          onClick={() => handleRemoveFromPalette(plant.id)}
                          className="mt-2 text-sm text-red-600 hover:text-red-700"
                        >
                          {isZh ? "移除" : "Remove"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            selectedPlants.map((plant) => (
              <div
                key={plant.id}
                className="flex items-start gap-3 rounded-xl border border-gray-200 p-3"
              >
                {/* 植物缩略图 / Plant thumbnail */}
                <img
                  src={plant.image_url}
                  alt={plant.common_name}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  {/* 常见名 / Common name */}
                  <p className="font-medium">{plant.common_name}</p>
                  {/* 学名 / Botanical name */}
                  <p className="text-xs italic text-gray-500">
                    {plant.botanical_name}
                  </p>
                  {/* 点击后从调色板移除当前植物 / Remove current plant from palette */}
                  <button
                    onClick={() => handleRemoveFromPalette(plant.id)}
                    className="mt-2 text-sm text-red-600 hover:text-red-700"
                  >
                    {isZh ? "移除" : "Remove"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 
        主操作按钮：生成 Board。
        Main action button: generate board.
        当 selectedPlants 为空时禁用，避免生成空内容。
        Disabled when selectedPlants is empty to prevent creating an empty board.
      */}
      <button
        onClick={handleGenerateBoard}
        disabled={selectedPlants.length === 0}
        className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
        {isZh ? "生成看板" : "Generate Board"}
      </button>
    </aside>
  );
}

export default PalettePanel;
