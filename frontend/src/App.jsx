import { useEffect, useMemo,useState } from "react";
import FilterPanel from "./components/FilterPanel";
import ResultsPanel from "./components/ResultsPanel";
import PalettePanel from "./components/PalettePanel";

const CHANGELOG_VERSION = "v2";
const CHANGELOG_RELEASE_DATE = "April 10, 2026";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return API_BASE;
  }
})();

const resolveImageUrl = (url, apiOrigin = API_ORIGIN) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) {
    return `${apiOrigin}${url}`;
  }
  return url;
};

const normalizeText = (value) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isSubsequence = (query, target) => {
  let i = 0;
  let j = 0;
  while (i < query.length && j < target.length) {
    if (query[i] === target[j]) i += 1;
    j += 1;
  }
  return i === query.length;
};

const editDistance = (a, b) => {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

const fuzzyMatch = (query, rawCandidates) => {
  const q = normalizeText(query);
  if (!q) return true;
  const firstChar = q[0];

  return rawCandidates.some((candidate) => {
    const text = normalizeText(candidate);
    if (!text) return false;
    const words = text.split(" ").filter(Boolean);

    // Require first-letter alignment before fuzzy matching.
    // At least one word in the candidate must start with the same first letter.
    const startsWithSameFirstLetter =
      words.some((word) => word[0] === firstChar) || text[0] === firstChar;
    if (!startsWithSameFirstLetter) return false;

    if (text.includes(q) || text.startsWith(q)) return true;
    if (q.length >= 2 && isSubsequence(q, text)) return true;
    return words.some((word) => {
      if (!word) return false;
      if (word.includes(q) || word.startsWith(q)) return true;
      const maxDistance = q.length <= 4 ? 1 : 2;
      return editDistance(q, word) <= maxDistance;
    });
  });
};

const parseImportedPlantNames = (text) => {
  const raw = (text || "").trim();
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            return (
              item.common_name ||
              item.botanical_name ||
              item.name ||
              item.plant ||
              ""
            );
          }
          return "";
        })
        .filter(Boolean);
    }
  } catch {
    // Not JSON, fall through to text/csv parsing.
  }

  return raw
    .split(/[\n,;\t]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
};

function App() {
  // 植物原始数据 / Raw plant data from backend
  const [plants, setPlants] = useState([]);

  // 页面加载状态 / Loading state for initial fetch
  const [loading, setLoading] = useState(true);
  const [showChangelog, setShowChangelog] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // 用户加入 palette 的植物 / Plants selected by user for the palette
  const [selectedPlants, setSelectedPlants] = useState(() => {
  const saved = localStorage.getItem("paletteBoard");
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return parsed.map((plant) => ({
      ...plant,
      image_url: resolveImageUrl(plant.image_url),
    }));
  } catch {
    return [];
  }
  });

  // HOA 列表 / List of HOAs from backend
  const [hoaLists, setHoaLists] = useState([]);

  // 用户选的 HOA / Currently selected HOA filter
  const [selectedHoa, setSelectedHoa] = useState("");

  // 当前筛选条件 / Current filter values
  const [filters, setFilters] = useState({
    searchField: "common",
    searchText: "",
    plantType: "",
    flowerColor: "",
    bloomSeason: "",
  });
  const [importStatus, setImportStatus] = useState("");
  // 页面加载时从后端获取植物数据和 HOA 数据
  // Fetch plant data + HOA data from backend when page first loads
  useEffect(() => {
    const seenVersion = localStorage.getItem("changelogSeenVersion");
    if (seenVersion !== CHANGELOG_VERSION) {
      setShowChangelog(true);
    }

    const fetchData = async () => {
      try {
        const [plantsRes, hoaRes] = await Promise.all([
          fetch(`${API_BASE}/plants`),
          fetch(`${API_BASE}/hoas`)
        ]);

        if (!plantsRes.ok ) {
          throw new Error("Failed to fetch plant data");
        }
        if (!hoaRes.ok) {
          throw new Error("Failed to fetch HOA data");
        }

        const plantsData = await plantsRes.json();
        const hoaData = await hoaRes.json();
        const apiOrigin = new URL(plantsRes.url).origin;

        console.log("Plants loaded:", plantsData);
        console.log("HOAs loaded:", hoaData);

        const normalizedPlants = plantsData.map((plant) => ({
          ...plant,
          image_url: resolveImageUrl(plant.image_url, apiOrigin),
        }));

        setPlants(normalizedPlants);
        setHoaLists(hoaData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCloseChangelog = () => {
    setShowChangelog(false);
    if (dontShowAgain) {
      localStorage.setItem("changelogSeenVersion", CHANGELOG_VERSION);
    } else {
      localStorage.removeItem("changelogSeenVersion");
    }
  };


  // 加入 palette，避免重复加入
  // Add plant to palette, avoid duplicates
  const handleAddToPalette = (plant) => {
  setSelectedPlants((prev) => {
    const alreadySelected = prev.some((p) => p.id === plant.id);
    if (alreadySelected) return prev;

    const updated = [...prev, plant];
    localStorage.setItem("paletteBoard", JSON.stringify(updated));
    return updated;
  });
};
  // 从 palette 中移除植物
  // Remove a plant from the palette
  const handleRemoveFromPalette = (plantId) => {
  setSelectedPlants((prev) => {
    const updated = prev.filter((plant) => plant.id !== plantId);
    localStorage.setItem("paletteBoard", JSON.stringify(updated));
    return updated;
  });
};

  // 清空整个 palette
  // Remove all plants from the palette
  const handleRemoveAllFromPalette = () => {
    setSelectedPlants([]);
    localStorage.setItem("paletteBoard", JSON.stringify([]));
  };

  // 从导入文件中批量加入 palette（按 common/botanical 名称匹配）
  const handleImportPlantFile = async (file) => {
    if (!file) return;

    try {
      const content = await file.text();
      const names = parseImportedPlantNames(content);

      if (!names.length) {
        setImportStatus("No valid plant names found in file.");
        return;
      }

      if (!plants.length) {
        setImportStatus("Plant catalog is not loaded yet. Please try again.");
        return;
      }

      const byCommon = new Map();
      const byBotanical = new Map();
      plants.forEach((plant) => {
        byCommon.set(normalizeText(plant.common_name), plant);
        byBotanical.set(normalizeText(plant.botanical_name), plant);
      });

      const matched = [];
      const unmatched = [];
      names.forEach((name) => {
        const key = normalizeText(name);
        if (!key) return;
        const found = byCommon.get(key) || byBotanical.get(key);
        if (found) matched.push(found);
        else unmatched.push(name);
      });

      if (!matched.length) {
        setImportStatus(
          `Imported 0 plants. ${unmatched.length} unmatched names (check spelling).`
        );
        return;
      }

      setSelectedPlants((prev) => {
        const updated = [...prev];
        const existingIds = new Set(prev.map((plant) => plant.id));
        matched.forEach((plant) => {
          if (!existingIds.has(plant.id)) {
            updated.push(plant);
            existingIds.add(plant.id);
          }
        });
        localStorage.setItem("paletteBoard", JSON.stringify(updated));
        return updated;
      });

      setImportStatus(
        `Imported ${matched.length} matched names. ${unmatched.length} unmatched.`
      );
    } catch (error) {
      console.error("Import failed:", error);
      setImportStatus("Import failed. Please use .txt, .csv or .json file.");
    }
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
      const botanicalName = plant.botanical_name || "";
      const searchText = filters.searchText || "";
      const searchCandidates =
        filters.searchField === "botanical"
          ? [botanicalName]
          : [plantName];
      const matchesSearch = fuzzyMatch(searchText, searchCandidates);
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
      return matchesSearch && matchesHoa && matchesType && matchesColor && matchesBloom;
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
      {showChangelog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">What&apos;s New</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Updated on {CHANGELOG_RELEASE_DATE}
                </p>
              </div>
              <button
                onClick={handleCloseChangelog}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">Version 1</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Basic 3-panel layout with filtering, plant results, and palette
                  selection.
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">Version 2</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  <li>Smart search with Common/Botanical toggle</li>
                  <li>Import plant list (.txt/.csv/.json) in Palette panel</li>
                  <li>Group-by-Type toggle in Palette and Palette Board</li>
                  <li>Drag-and-drop reorder and sorting in Palette Board</li>
                  <li>Wider responsive 3-panel layout for ultra-wide screens</li>
                  <li>Remove All action in Palette panel</li>
                </ul>
              </div>
            </div>

            <label className="mt-5 inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-400"
              />
              Do not show this update again
            </label>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[2200px] px-4 py-6 sm:px-6 xl:px-8 2xl:px-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Plant Palette Tool</h1>
          <p className="mt-2 text-sm text-gray-600">
            Version 2 – Smart Search / Import / Grouping / Drag & Sort
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 2xl:gap-8">
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
          handleRemoveAllFromPalette={handleRemoveAllFromPalette}
          handleImportPlantFile={handleImportPlantFile}
          importStatus={importStatus}
        />
        </div>
      </div>
    </div>
  );
}

export default App;
