import { useEffect, useRef, useState } from "react";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

function ChatAssistantPanel({ language, onAddToPalette }) {
  const isZh = language === "zh";
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [sizeMode, setSizeMode] = useState("md");
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [recommendedPlants, setRecommendedPlants] = useState([]);
  const dragRef = useRef({ active: false, offsetX: 0, offsetY: 0 });
  const windowRef = useRef(null);
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      role: "assistant",
      content: isZh
        ? "你好，我是你的植物助手。告诉我场景（光照、花色、维护难度），我来帮你选。"
        : "Hi, I am your plant assistant. Tell me your constraints (sunlight, flower color, maintenance), and I will help you choose.",
    },
  ]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          language: isZh ? "zh" : "en",
        }),
      });

      if (!res.ok) {
        let detail = "Request failed.";
        try {
          const data = await res.json();
          detail = data?.detail || detail;
        } catch {
          // Ignore parse errors and keep fallback message.
        }
        throw new Error(detail);
      }

      const data = await res.json();
      setRecommendedPlants(Array.isArray(data?.recommended_plants) ? data.recommended_plants : []);
      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          data?.reply ||
          (isZh ? "这次没有成功生成回复，请再试一次。" : "Could not generate a reply this time. Please try again."),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setRecommendedPlants([]);
      const assistantError = {
        id: Date.now() + 1,
        role: "assistant",
        content: isZh
          ? `请求失败：${error.message}`
          : `Request failed: ${error.message}`,
      };
      setMessages((prev) => [...prev, assistantError]);
    } finally {
      setIsSending(false);
    }
  };

  const sizeClassMap = {
    sm: "w-72 h-[420px]",
    md: "w-96 h-[520px]",
    lg: "w-[28rem] h-[620px]",
  };

  const startDrag = (event) => {
    if (!windowRef.current) return;
    const rect = windowRef.current.getBoundingClientRect();
    dragRef.current = {
      active: true,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!dragRef.current.active) return;
      const maxX = window.innerWidth - (windowRef.current?.offsetWidth || 0);
      const maxY = window.innerHeight - (windowRef.current?.offsetHeight || 0);
      const nextX = Math.min(
        Math.max(0, event.clientX - dragRef.current.offsetX),
        Math.max(0, maxX)
      );
      const nextY = Math.min(
        Math.max(0, event.clientY - dragRef.current.offsetY),
        Math.max(0, maxY)
      );
      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      dragRef.current.active = false;
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-xl text-white shadow-lg hover:bg-black"
        aria-label={isZh ? "打开 AI 助手" : "Open AI assistant"}
      >
        🌿
      </button>
    );
  }

  return (
    <section
      ref={windowRef}
      className={`fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-400 bg-gray-50 shadow-2xl ${sizeClassMap[sizeMode]}`}
      style={{ left: position.x, top: position.y }}
    >
      <div
        onMouseDown={startDrag}
        className={`flex cursor-move items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 ${
          isDragging ? "select-none" : ""
        }`}
      >
        <h2 className="text-sm font-semibold">
          {isZh ? "AI 植物助手" : "AI Plant Assistant"}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSizeMode("sm")}
            className={`rounded px-2 py-1 text-xs ${sizeMode === "sm" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700 border border-gray-300"}`}
          >
            S
          </button>
          <button
            onClick={() => setSizeMode("md")}
            className={`rounded px-2 py-1 text-xs ${sizeMode === "md" ? "bg-gray-900 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
          >
            M
          </button>
          <button
            onClick={() => setSizeMode("lg")}
            className={`rounded px-2 py-1 text-xs ${sizeMode === "lg" ? "bg-gray-900 text-white" : "bg-white text-gray-700 border border-gray-300"}`}
          >
            L
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700"
          >
            {isZh ? "最小化" : "Min"}
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              message.role === "user"
                ? "ml-auto bg-gray-900 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            {message.content}
          </div>
        ))}

        {recommendedPlants.length > 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3">
            <p className="mb-2 text-xs font-semibold text-green-800">
              {isZh ? "推荐植物" : "Recommended Plants"}
            </p>
            <div className="space-y-2">
              {recommendedPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="flex items-center justify-between rounded-lg border border-green-100 bg-white px-2 py-1.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <img
                      src={plant.image_url}
                      alt={plant.common_name}
                      className="h-10 w-10 rounded-md object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800">{plant.common_name}</p>
                    <p className="truncate text-xs text-gray-500">{plant.botanical_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onAddToPalette?.(plant)}
                    className="ml-2 rounded border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                  >
                    {isZh ? "加入" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={isSending}
            placeholder={
              isZh
                ? "例如：我家前院半阴、低维护、想要紫花"
                : "Example: front yard, partial shade, low maintenance, purple flowers"
            }
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isSending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            {isSending ? (isZh ? "发送中..." : "Sending...") : isZh ? "发送" : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default ChatAssistantPanel;
