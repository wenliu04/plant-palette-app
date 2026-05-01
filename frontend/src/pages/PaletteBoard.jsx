import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";

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
  if (/^https?:\/\//i.test(url)) {
    // Migrate stale localhost URLs from old localStorage data to current API origin.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(url)) {
      try {
        const parsed = new URL(url);
        return `${apiOrigin}${parsed.pathname}`;
      } catch {
        return url;
      }
    }
    return url;
  }
  if (url.startsWith("/")) {
    return `${apiOrigin}${url}`;
  }
  return url;
};

const TYPE_ORDER = ["Tree", "Shrub", "Grass", "Groundcover", "Perennial", "Succulent", "Vine"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASON_MONTHS = {
  spring: [2, 3, 4],
  summer: [5, 6, 7],
  fall: [8, 9, 10],
  winter: [11, 0, 1],
};

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

const getBloomMonths = (plant) => {
  const seasons = (plant?.bloom_season || [])
    .map((season) => String(season).trim().toLowerCase())
    .filter(Boolean);
  const set = new Set();
  seasons.forEach((season) => {
    (SEASON_MONTHS[season] || []).forEach((month) => set.add(month));
  });
  return set;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchImageDataUrl = async (url) => {
  if (!url) return null;
  try {
    const resolvedUrl = resolveImageUrl(url);
    let finalUrl = resolvedUrl;
    if (import.meta.env.DEV) {
      try {
        const parsed = new URL(resolvedUrl);
        if (
          /^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname) &&
          parsed.pathname.startsWith("/static/")
        ) {
          finalUrl = `/api-static${parsed.pathname}`;
        }
      } catch {
        // Keep original URL if parsing fails.
      }
    }
    const response = await fetch(finalUrl, { mode: "cors" });
    console.log("[PDF] image fetch", { finalUrl, status: response.status, ok: response.ok });
    if (!response.ok) return null;
    const blob = await response.blob();
    console.log("[PDF] image blob", { finalUrl, size: blob.size, type: blob.type });
    const dataUrl = await blobToDataUrl(blob);
    return typeof dataUrl === "string" ? dataUrl : null;
  } catch (error) {
    console.error("[PDF] image fetch failed", { url, error });
    return null;
  }
};

function PaletteBoard() {
  // 存储当前 board 的植物列表
  // State to store plants in the palette board
  const [boardPlants, setBoardPlants] = useState([]);
  const [sortMode, setSortMode] = useState("manual");
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [groupByType, setGroupByType] = useState(false);
  const groupedBoardPlants = groupPlantsByType(boardPlants);

  // 用于页面跳转（返回主页面）
  // Navigation hook for routing between pages
  const navigate = useNavigate();

  // 页面加载时，从 localStorage 读取已保存的 palette
  // Load palette data from localStorage when component mounts
  useEffect(() => {
    const saved = localStorage.getItem("paletteBoard");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = parsed.map((plant) => ({
          ...plant,
          image_url: resolveImageUrl(plant.image_url),
        }));
        setBoardPlants(normalized);
        // Persist normalized URLs back to localStorage to avoid repeated stale-url issues.
        localStorage.setItem("paletteBoard", JSON.stringify(normalized));
      } catch {
        setBoardPlants([]);
      }
    }
  }, []);

  // 更新 state + 同步 localStorage
  // Update state and persist to localStorage
  const updateBoardPlants = (updated) => {
    setBoardPlants(updated);
    localStorage.setItem("paletteBoard", JSON.stringify(updated));
  };

  const sortPlants = (items, mode) => {
    if (mode === "manual") return items;
    const sorted = [...items];
    if (mode === "commonAsc") {
      sorted.sort((a, b) =>
        (a.common_name || "").localeCompare(b.common_name || "")
      );
    } else if (mode === "commonDesc") {
      sorted.sort((a, b) =>
        (b.common_name || "").localeCompare(a.common_name || "")
      );
    } else if (mode === "botanicalAsc") {
      sorted.sort((a, b) =>
        (a.botanical_name || "").localeCompare(b.botanical_name || "")
      );
    }
    return sorted;
  };

  const handleSortChange = (mode) => {
    setSortMode(mode);
    updateBoardPlants(sortPlants(boardPlants, mode));
  };

  const movePlant = (dragId, targetId) => {
    if (!dragId || !targetId || dragId === targetId) return;
    const fromIndex = boardPlants.findIndex((plant) => plant.id === dragId);
    const toIndex = boardPlants.findIndex((plant) => plant.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...boardPlants];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setSortMode("manual");
    updateBoardPlants(reordered);
  };

  // 删除某个植物
  // Remove a plant from the board
  const handleRemovePlant = (plantId) => {
    const updated = boardPlants.filter((plant) => plant.id !== plantId);
    updateBoardPlants(updated);
  };

  // 返回主页面
  // Navigate back to the plant selector page
  const handleBack = () => {
    navigate("/");
  };

  const buildBoardPdf = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    let y = 14;

    const ensureSpace = (needed = 10) => {
      if (y + needed > 287) {
        pdf.addPage();
        y = 14;
      }
    };

    pdf.setFontSize(18);
    pdf.text("Palette Board", 14, y);
    y += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Plants: ${boardPlants.length}`, 14, y);
    pdf.setTextColor(0, 0, 0);
    y += 8;

    ensureSpace(16);
    pdf.setFontSize(13);
    pdf.text("Bloom Timeline", 14, y);
    y += 6;

    const left = 14;
    const labelW = 42;
    const monthW = 12;
    const rowH = 6;

    pdf.setFontSize(8);
    MONTHS.forEach((m, i) => {
      pdf.text(m, left + labelW + i * monthW + 2, y);
    });
    y += 4;

    boardPlants.forEach((plant) => {
      ensureSpace(rowH + 2);
      const bloomMonths = getBloomMonths(plant);
      pdf.setFontSize(8);
      pdf.text(String(plant.common_name || "Unknown").slice(0, 22), left, y + 4);
      for (let i = 0; i < 12; i += 1) {
        const x = left + labelW + i * monthW;
        const isBlooming = bloomMonths.has(i);
        if (isBlooming) {
          pdf.setFillColor(134, 239, 172);
          pdf.rect(x, y, monthW - 1, rowH, "F");
        } else {
          pdf.setDrawColor(220, 220, 220);
          pdf.rect(x, y, monthW - 1, rowH);
        }
      }
      y += rowH + 2;
    });

    y += 4;
    ensureSpace(10);
    pdf.setFontSize(13);
    pdf.text("Plant Details", 14, y);
    y += 7;

    pdf.setFontSize(12);
    for (let index = 0; index < boardPlants.length; index += 1) {
      const plant = boardPlants[index];
      const cardH = 30;
      ensureSpace(cardH + 4);
      const imageDataUrl = await fetchImageDataUrl(plant.image_url);
      const cardTop = y - 2;

      pdf.setDrawColor(225, 225, 225);
      pdf.roundedRect(14, cardTop, 182, cardH, 2, 2);

      if (imageDataUrl) {
        try {
          const imageFormat = imageDataUrl.includes("image/png") ? "PNG" : "JPEG";
          pdf.addImage(imageDataUrl, imageFormat, 18, y + 1, 24, 24);
          console.log("[PDF] image embedded", { plant: plant.common_name, imageFormat });
        } catch (error) {
          console.error("[PDF] image embed failed", { plant: plant.common_name, error });
          // Ignore image embed errors and continue with text.
        }
      } else {
        console.warn("[PDF] image skipped (no data)", { plant: plant.common_name, url: plant.image_url });
      }

      const textX = 48;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(`${index + 1}. ${plant.common_name || "Unknown"}`, textX, y + 4);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      pdf.text(`Botanical: ${plant.botanical_name || "N/A"}`, textX, y + 10);
      pdf.text(`Type: ${plant.plant_type || "N/A"} | Color: ${plant.flower_color || "N/A"}`, textX, y + 16);
      pdf.text(`Height: ${plant.height || "N/A"} | Sun: ${plant.sun_exposure || "N/A"}`, textX, y + 22);
      y += cardH + 4;
    }

    return pdf;
  };

  // 导出 PDF
  // Export the palette board as a PDF
  const handleExportPDF = async () => {
    const pdf = await buildBoardPdf();
    pdf.save("palette-board.pdf");
  };

  const handlePreviewPDF = async () => {
    const pdf = await buildBoardPdf();
    const blobUrl = pdf.output("bloburl");
    window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div id="palette-board-page" className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* 顶部工具栏 */}
        {/* Header section */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          {/* 返回按钮 */}
          {/* Back button */}
          <button
            onClick={handleBack}
            className="no-print rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            ← Back to Plant Selector
          </button>

          {/* 标题 */}
          {/* Page title */}
          <h1 className="text-3xl font-bold">Palette Board</h1>

          {/* 右侧信息 + 导出按钮 */}
          {/* Plant count + export button */}
          <div className="flex items-center gap-3">

            {/* 显示植物数量 */}
            {/* Display number of plants */}
            <div className="text-sm text-gray-500">
              {boardPlants.length} plants
            </div>

            {/* PDF导出按钮 */}
            {/* Export PDF button */}
            <button
              onClick={handleExportPDF}
              disabled={boardPlants.length === 0}
              className="no-print rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Export PDF
            </button>
            <button
              onClick={handlePreviewPDF}
              disabled={boardPlants.length === 0}
              className="no-print rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              Preview PDF
            </button>
            <button
              onClick={handlePrintPdf}
              disabled={boardPlants.length === 0}
              className="no-print rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>

        <div className="no-print mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="board-sort" className="text-sm text-gray-600">
                Sort
              </label>
              <select
                id="board-sort"
                value={sortMode}
                onChange={(e) => handleSortChange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="manual">Manual (Drag)</option>
                <option value="commonAsc">Common Name A-Z</option>
                <option value="commonDesc">Common Name Z-A</option>
                <option value="botanicalAsc">Botanical Name A-Z</option>
                </select>
            </div>
            <button
              onClick={() => setGroupByType((prev) => !prev)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                groupByType
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Group by Type
            </button>
            <span className="text-xs text-gray-500">
              Drag cards to reorder in Manual mode.
            </span>
          </div>
        </div>

        {/* 导出区域（PDF截图区域） */}
        {/* Export area for PDF */}
        <div id="palette-board-export" className="space-y-6">
          {boardPlants.length > 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Bloom Timeline</h2>
                <p className="text-sm text-gray-500">
                  Compare bloom periods across your selected plants.
                </p>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[780px]">
                  <div className="mb-1 grid grid-cols-[180px_repeat(12,minmax(0,1fr))] gap-1">
                    <div className="px-2 text-xs font-medium text-gray-500">Plant</div>
                    {MONTHS.map((month) => (
                      <div
                        key={month}
                        className="rounded-md bg-gray-100 py-1 text-center text-xs font-medium text-gray-600"
                      >
                        {month}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    {boardPlants.map((plant) => {
                      const bloomMonths = getBloomMonths(plant);
                      return (
                        <div
                          key={`timeline-${plant.id}`}
                          className="grid grid-cols-[180px_repeat(12,minmax(0,1fr))] gap-1"
                        >
                          <div className="truncate rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                            {plant.common_name}
                          </div>
                          {MONTHS.map((month, index) => {
                            const isBlooming = bloomMonths.has(index);
                            return (
                              <div
                                key={`${plant.id}-${month}`}
                                className={`h-6 rounded-md border ${
                                  isBlooming
                                    ? "border-green-300 bg-green-200"
                                    : "border-gray-200 bg-white"
                                }`}
                                title={isBlooming ? `${plant.common_name}: Blooming` : `${plant.common_name}: Not blooming`}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 空状态 */}
          {/* Empty state */}
          {boardPlants.length === 0 ? (
            <p className="text-gray-500">No plants in board.</p>
          ) : (

            // 植物卡片网格
            // Plant card grid layout
            groupByType ? (
              <div className="space-y-6">
                {groupedBoardPlants.map(([type, plants]) => (
                  <section key={type}>
                    <h2 className="mb-3 text-lg font-semibold text-gray-800">
                      {type} ({plants.length})
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {plants.map((plant) => (
                        <div
                          key={plant.id}
                          draggable
                          onDragStart={() => setDraggingId(plant.id)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverId(plant.id);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            movePlant(draggingId, plant.id);
                            setDraggingId(null);
                            setDragOverId(null);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setDragOverId(null);
                          }}
                          className={`rounded-2xl border bg-white p-4 shadow-sm ${
                            dragOverId === plant.id
                              ? "border-gray-900 ring-2 ring-gray-200"
                              : "border-gray-200"
                          }`}
                        >

                          {/* 图片 */}
                          {/* Plant image */}
                          <img
                            src={resolveImageUrl(plant.image_url)}
                            alt={plant.common_name}
                            loading="lazy"
                            decoding="async"
                            className="mb-3 aspect-square w-full rounded-xl object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />

                          {/* 名称 */}
                          {/* Common name */}
                          <h2 className="text-lg font-semibold">{plant.common_name}</h2>

                          {/* 学名 */}
                          {/* Botanical name */}
                          <p className="text-sm italic text-gray-500">
                            {plant.botanical_name}
                          </p>

                          {/* 属性信息 */}
                          {/* Plant attributes */}
                          <div className="mt-2 space-y-1 text-sm text-gray-700">
                            <p>Type: {plant.plant_type}</p>
                            <p>Color: {plant.flower_color || "N/A"}</p>
                            <p>Height: {plant.height || "N/A"}</p>
                          </div>

                          {/* 删除按钮 */}
                          {/* Remove plant button */}
                          <button
                            onClick={() => handleRemovePlant(plant.id)}
                            className="mt-3 rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {boardPlants.map((plant) => (
                  <div
                    key={plant.id}
                    draggable
                    onDragStart={() => setDraggingId(plant.id)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverId(plant.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      movePlant(draggingId, plant.id);
                      setDraggingId(null);
                      setDragOverId(null);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverId(null);
                    }}
                    className={`rounded-2xl border bg-white p-4 shadow-sm ${
                      dragOverId === plant.id
                        ? "border-gray-900 ring-2 ring-gray-200"
                        : "border-gray-200"
                    }`}
                  >

                    {/* 图片 */}
                    {/* Plant image */}
                    <img
                      src={resolveImageUrl(plant.image_url)}
                      alt={plant.common_name}
                      loading="lazy"
                      decoding="async"
                      className="mb-3 aspect-square w-full rounded-xl object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />

                    {/* 名称 */}
                    {/* Common name */}
                    <h2 className="text-lg font-semibold">{plant.common_name}</h2>

                    {/* 学名 */}
                    {/* Botanical name */}
                    <p className="text-sm italic text-gray-500">
                      {plant.botanical_name}
                    </p>

                    {/* 属性信息 */}
                    {/* Plant attributes */}
                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                      <p>Type: {plant.plant_type}</p>
                      <p>Color: {plant.flower_color || "N/A"}</p>
                      <p>Height: {plant.height || "N/A"}</p>
                    </div>

                    {/* 删除按钮 */}
                    {/* Remove plant button */}
                    <button
                      onClick={() => handleRemovePlant(plant.id)}
                      className="mt-3 rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default PaletteBoard;
