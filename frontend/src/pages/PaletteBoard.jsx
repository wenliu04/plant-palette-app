import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function PaletteBoard() {
  // 存储当前 board 的植物列表
  // State to store plants in the palette board
  const [boardPlants, setBoardPlants] = useState([]);

  // 用于页面跳转（返回主页面）
  // Navigation hook for routing between pages
  const navigate = useNavigate();

  // 页面加载时，从 localStorage 读取已保存的 palette
  // Load palette data from localStorage when component mounts
  useEffect(() => {
    const saved = localStorage.getItem("paletteBoard");
    if (saved) {
      setBoardPlants(JSON.parse(saved));
    }
  }, []);

  // 更新 state + 同步 localStorage
  // Update state and persist to localStorage
  const updateBoardPlants = (updated) => {
    setBoardPlants(updated);
    localStorage.setItem("paletteBoard", JSON.stringify(updated));
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
    const boardElement = document.getElementById("palette-board-export");

    // 如果找不到元素就直接退出
    // Exit if export container not found
    if (!boardElement) return;

    // 将页面区域转为 canvas
    // Convert DOM element into canvas
    const canvas = await html2canvas(boardElement, {
      scale: 2, // 提高清晰度
      useCORS: true, // 允许跨域图片
      backgroundColor: "#f9fafb", // 背景颜色
    });

    // 转为图片数据
    // Convert canvas to image
    const imgData = canvas.toDataURL("image/png");

    // 创建 PDF（A4尺寸）
    // Create PDF document
    const pdf = new jsPDF("p", "mm", "a4");

    // PDF宽度（A4宽度）
    // A4 width in mm
    const pdfWidth = 210;

    // 按比例计算高度
    // Calculate proportional height
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // 将图片加入 PDF
    // Add image to PDF
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

    // 下载 PDF
    // Save/download PDF
    pdf.save("palette-board.pdf");
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

              {boardPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >

                  {/* 图片 */}
                  {/* Plant image */}
                  <img
                    src={plant.image_url}
                    alt={plant.common_name}
                    className="mb-3 h-48 w-full rounded-xl object-cover"
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
          )}
        </div>
      </div>
    </div>
  );
}

export default PaletteBoard;