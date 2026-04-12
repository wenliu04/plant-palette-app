import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/1000x1000?text=No+Image";
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
        setBoardPlants(
          parsed.map((plant) => ({
            ...plant,
            image_url: resolveImageUrl(plant.image_url),
          }))
        );
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

  // 导出 PDF
  // Export the palette board as a PDF
  const handleExportPDF = async () => {
    try {
      const boardElement = document.getElementById("palette-board-export");

      // 如果找不到元素就直接退出
      // Exit if export container not found
      if (!boardElement) return;

      // 将页面区域转为 canvas
      // Convert DOM element into canvas
      const canvas = await html2canvas(boardElement, {
        scale: 2, // 提高清晰度 / improve sharpness
        useCORS: true, // 尝试跨域图片加载 / try CORS image loading
        backgroundColor: "#f9fafb",
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: boardElement.scrollWidth,
      });

      // 转为图片数据
      // Convert canvas to image
      const imgData = canvas.toDataURL("image/png");

      // 创建 PDF（A4尺寸）
      // Create PDF document (A4)
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const contentHeight = pageHeight - margin * 2;

      // 按比例计算渲染高度
      // Compute proportional render height
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      // 支持多页：内容超过一页时自动分页
      // Multi-page support: paginate when content exceeds one page
      let heightLeft = imgHeight;
      let positionY = margin;

      pdf.addImage(imgData, "PNG", margin, positionY, contentWidth, imgHeight);
      heightLeft -= contentHeight;

      while (heightLeft > 0) {
        positionY = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, positionY, contentWidth, imgHeight);
        heightLeft -= contentHeight;
      }

      // 下载 PDF
      // Save/download PDF
      pdf.save("palette-board.pdf");
    } catch (error) {
      // 如果图片跨域导致截图失败，降级为文本 PDF，保证仍可导出。
      // Fallback to a text-only PDF if screenshot export fails (e.g., CORS images).
      console.error("PDF export failed, fallback to text PDF:", error);

      const fallbackPdf = new jsPDF("p", "mm", "a4");
      let y = 16;

      fallbackPdf.setFontSize(16);
      fallbackPdf.text("Palette Board", 14, y);
      y += 10;

      fallbackPdf.setFontSize(11);
      fallbackPdf.text(`Plants: ${boardPlants.length}`, 14, y);
      y += 8;

      if (boardPlants.length === 0) {
        fallbackPdf.text("No plants in board.", 14, y);
      } else {
        boardPlants.forEach((plant, index) => {
          if (y > 280) {
            fallbackPdf.addPage();
            y = 16;
          }
          fallbackPdf.text(`${index + 1}. ${plant.common_name || "Unknown"}`, 14, y);
          y += 6;
          fallbackPdf.text(`   Botanical: ${plant.botanical_name || "N/A"}`, 14, y);
          y += 6;
          fallbackPdf.text(`   Type: ${plant.plant_type || "N/A"} | Color: ${plant.flower_color || "N/A"} | Height: ${plant.height || "N/A"}`, 14, y);
          y += 8;
        });
      }

      fallbackPdf.save("palette-board.txt-fallback.pdf");
      window.alert("图片版 PDF 导出失败，已为你导出文字版 PDF（可能是图片跨域限制）。");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">

        {/* 顶部工具栏 */}
        {/* Header section */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          {/* 返回按钮 */}
          {/* Back button */}
          <button
            onClick={handleBack}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
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
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = FALLBACK_IMAGE;
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
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
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
