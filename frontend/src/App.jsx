import { useEffect, useMemo,useState } from "react";
import FilterPanel from "./components/FilterPanel";
import ResultsPanel from "./components/ResultsPanel";
import PalettePanel from "./components/PalettePanel";

function App() {
  // 植物原始数据 / Raw plant data from backend
  const [plants, setPlants] = useState([]);

  // 页面加载状态 / Loading state for initial fetch
  const [loading, setLoading] = useState(true);

  // 用户加入 palette 的植物 / Plants selected by user for the palette
  const [selectedPlants, setSelectedPlants] = useState([]);

  // HOA 列表 / List of HOAs from backend
  const [hoaLists, setHoaLists] = useState([]);

  // 用户选的 HOA / Currently selected HOA filter
  const [selectedHoa, setSelectedHoa] = useState("");

  // 当前筛选条件 / Current filter values
  const [filters, setFilters] = useState({
    plantType: "",
    flowerColor: "",
    bloomSeason: "",
  });
  // 页面加载时从后端获取植物数据和 HOA 数据
  // Fetch plant data + HOA data from backend when page first loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plantsRes, hoaRes] = await Promise.all([
          fetch("http://localhost:8000/plants"),
          fetch("http://localhost:8000/hoas")
        ]);

        if (!plantsRes.ok ) {
          throw new Error("Failed to fetch plant data");
        }
        if (!hoaRes.ok) {
          throw new Error("Failed to fetch HOA data");
        }

        const plantsData = await plantsRes.json();
        const hoaData = await hoaRes.json();

        console.log("Plants loaded:", plantsData);
        console.log("HOAs loaded:", hoaData);

        setPlants(plantsData);
        setHoaLists(hoaData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  // 加入 palette，避免重复加入
  // Add plant to palette, avoid duplicates
  const handleAddToPalette = (plant) => {
    const alreadySelected = selectedPlants.some((p) => p.id === plant.id);
    if (!alreadySelected) {
      setSelectedPlants([...selectedPlants, plant]);
    }
  };
  // 从 palette 中移除植物
  // Remove a plant from the palette
  const handleRemoveFromPalette = (plantId) => {
    setSelectedPlants(selectedPlants.filter((plant) => plant.id !== plantId));
  };
  // 更新某一个筛选条件
  // Update one specific filter field
   const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  // 动态生成 HOA 下拉选项（取 HOA 名称，不是 approvedPlantIds）
  // Generate HOA dropdown options from HOA names
  const hoaOptions = useMemo(() => {
  return [...new Set(hoaLists.map((hoaList) => hoaList.name).filter(Boolean))];
  }, [hoaLists]);
  // 动态生成 Plant Type 下拉选项（去重）
  // Dynamically generate unique plant type options
  const plantTypeOptions = useMemo(() => {
    return [...new Set(plants.map((plant) => plant.plant_type).filter(Boolean))];
  }, [plants]);

  // 动态生成 Flower Color 下拉选项（兼容 string / array）
  const flowerColorOptions = useMemo(() => {
    return [
      ...new Set(
        plants
          .flatMap((plant) => {
            if (Array.isArray(plant.flower_color)) return plant.flower_color;
            if (plant.flower_color) return [plant.flower_color];
            return [];
          })
          .filter(Boolean)
      ),
    ];
  }, [plants]);
  // 动态生成 Bloom Season 下拉选项（去重）
  // bloom_season 现在是数组，例如 ["spring", "summer"]
  // We flatten bloom_season arrays first, then deduplicate them
  const bloomSeasonOptions = useMemo(() => {
    return [...new Set(
      plants
      .flatMap((plant) => plant.bloom_season||[]) // flatten bloom_season arrays, handle undefined
      .filter(Boolean))];
  }, [plants]);

  // 当前选中的 HOA 对象
  const selectedHoaObj = useMemo(() => {
    return hoaLists.find((hoaList) => hoaList.name === selectedHoa) || null;
  }, [hoaLists, selectedHoa]);

  // 先按 HOA 缩小范围，再按其他条件过滤
  // HOA is the first-level filter: if user selected an HOA, we only consider plants approved by that HOA
  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      // HOA 精确匹配；如果用户选了 HOA，就看这个植物的 ID 是否在对应 HOA 的 approvedPlantIds 里
      // Exact HOA match: if user selected an HOA, check if plant ID is in that HOA's approvedPlantIds
      const plantName = plant.common_name || plant.commonName || "";
      const matchesHoa = selectedHoaObj
        ? selectedHoaObj.approvedPlantNames.includes(plantName)
        : true;
      // 植物类型精确匹配
      // Exact plant type match
      const matchesType =
        !filters.plantType || plant.plant_type === filters.plantType;
      // 花色匹配：兼容 string / array
      const flowerColors = Array.isArray(plant.flower_color)
        ? plant.flower_color
        : plant.flower_color
        ? [plant.flower_color]
        : [];

        const matchesColor =
        !filters.flowerColor || flowerColors.includes(filters.flowerColor);

      // 花期匹配：plant.bloom_season 是数组
      // 例如 ["spring", "summer"]，如果用户选 spring，也算匹配
      // Bloom season match: bloom_season is an array, so we check inclusion
      const matchesBloom =
        !filters.bloomSeason ||
         (plant.bloom_season || []).includes(filters.bloomSeason);

      // 所有条件都满足才显示
      // Plant must satisfy all active filters
      return matchesHoa && matchesType && matchesColor && matchesBloom;
    });
  }, [plants,selectedHoaObj,filters]);

  // 仅用于显示，把 red -> Red, full_sun -> Full Sun
  // UI display helper only, does not affect filtering logic
  const formatLabel = (value) => {
    if (!value) return "";

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };


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
          <FilterPanel
          selectedHoa={selectedHoa}
          setSelectedHoa={setSelectedHoa}
          filters={filters}
          handleFilterChange={handleFilterChange}
          hoaOptions={hoaOptions}
          plantTypeOptions={plantTypeOptions}
          flowerColorOptions={flowerColorOptions}
          bloomSeasonOptions={bloomSeasonOptions}
          formatLabel={formatLabel}
        />
        <ResultsPanel
          loading={loading}
          filteredPlants={filteredPlants}
          handleAddToPalette={handleAddToPalette}
          formatLabel={formatLabel}
        />

        <PalettePanel
          selectedPlants={selectedPlants}
          handleRemoveFromPalette={handleRemoveFromPalette}
        />
        </div>
      </div>
    </div>
  );
}

export default App;