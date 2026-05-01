import os
import json
import time
import logging
import sqlite3
import re
from urllib.parse import urljoin
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Response
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pathlib import Path
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-4.1-mini").strip() or "gpt-4.1-mini"
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
DB_PATH = BASE_DIR / "plants.db"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("plant_agent")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

app = FastAPI()
# Explicit CORS allowlist for local + Vercel deployments.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://plant-palette-app-o2o6.vercel.app",
    "https://plant-palette-app.vercel.app",
]
STATIC_DIR = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def static_cors_header_fallback(request: Request, call_next):
    response: Response = await call_next(request)
    origin = request.headers.get("origin", "")
    is_allowed_exact = origin in origins
    is_allowed_localhost = bool(
        re.match(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", origin or "")
    )
    is_allowed_vercel = bool(re.match(r"^https://.*\.vercel\.app$", origin or ""))

    if origin and (is_allowed_exact or is_allowed_localhost or is_allowed_vercel):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
    return response
plants = [
    {
        "id": 1,
        "common_name": "Red Yucca",
        "botanical_name": "Hesperaloe parviflora",
        "plant_type": "Succulent",
        "flower_color": "Red",
        "height": "3-4 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "partial_shade",
        "leaf_color": "green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Spring", "Summer"],
        "image_url": "/static/plants/red-yucca.jpg",
    },
    {
        "id": 2,
        "common_name": "Lantana",
        "botanical_name": "Lantana camara",
        "plant_type": "Shrub",
        "flower_color": "Yellow",
        "height": "2-4 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "partial_shade",
        "leaf_color": "green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Summer", "Fall"],
        "image_url": "/static/plants/lantana.jpg",
    },
    {
        "id": 3,
        "common_name": "Lavender",
        "botanical_name": "Lavandula angustifolia",
        "plant_type": "Shrub",
        "flower_color": "Purple",
        "height": "2-3 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "gray_green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Spring", "Summer"],
        "image_url": "/static/plants/lavender.jpg",
    },
    {
        "id": 4,
        "common_name": "Texas Sage",
        "botanical_name": "Leucophyllum frutescens",
        "plant_type": "Shrub",
        "flower_color": "Purple",
        "height": "4-6 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "silver_green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Summer", "Fall"],
        "image_url": "/static/plants/texas-sage.jpg",
    },
    {
        "id": 5,
        "common_name": "Bougainvillea",
        "botanical_name": "Bougainvillea spp.",
        "plant_type": "Vine",
        "flower_color": "Pink",
        "height": "6-10 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "green",
        "foliage_type": "evergreen",
        "water_use": "medium",
        "bloom_season": ["Spring", "Summer", "Fall"],
        "image_url": "/static/plants/bougainvillea.jpg",
    },
    {
        "id": 6,
        "common_name": "Oleander",
        "botanical_name": "Nerium oleander",
        "plant_type": "Shrub",
        "flower_color": "Pink",
        "height": "6-12 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "partial_shade",
        "leaf_color": "green",
        "foliage_type": "evergreen",
        "water_use": "medium",
        "bloom_season": ["Spring", "Summer", "Fall"],
        "image_url": "/static/plants/oleander.jpg",
    },
    {
        "id": 7,
        "common_name": "Agave",
        "botanical_name": "Agave americana",
        "plant_type": "Succulent",
        "flower_color": "",
        "height": "4-6 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "blue_green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Summer"],
        "image_url": "/static/plants/agave.jpg",
    },
    {
        "id": 8,
        "common_name": "Aloe Vera",
        "botanical_name": "Aloe barbadensis",
        "plant_type": "Succulent",
        "flower_color": "Yellow",
        "height": "1-2 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "partial_shade",
        "leaf_color": "green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Winter", "Spring"],
        "image_url": "/static/plants/aloe-vera.jpg",
    },
    {
        "id": 9,
        "common_name": "Pink Muhly Grass",
        "botanical_name": "Muhlenbergia capillaris",
        "plant_type": "Grass",
        "flower_color": "Pink",
        "height": "2-3 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "green",
        "foliage_type": "deciduous",
        "water_use": "low",
        "bloom_season": ["Fall"],
        "image_url": "/static/plants/pink-muhly-grass.jpg",
    },
    {
        "id": 10,
        "common_name": "Deer Grass",
        "botanical_name": "Muhlenbergia rigens",
        "plant_type": "Grass",
        "flower_color": "",
        "height": "3-4 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Fall"],
        "image_url": "/static/plants/deer-grass.jpg",
    },
    {
        "id": 11,
        "common_name": "Rosemary",
        "botanical_name": "Salvia rosmarinus",
        "plant_type": "Groundcover",
        "flower_color": "Blue",
        "height": "1-2 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "dark_green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Winter", "Spring"],
        "image_url": "/static/plants/rosemary.jpg",
    },
    {
        "id": 12,
        "common_name": "Ice Plant",
        "botanical_name": "Delosperma cooperi",
        "plant_type": "Groundcover",
        "flower_color": "Purple",
        "height": "0.5-1 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "partial_shade",
        "leaf_color": "green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Spring", "Summer"],
        "image_url": "/static/plants/ice-plant.jpg",
    },
    {
        "id": 13,
        "common_name": "Blackfoot Daisy",
        "botanical_name": "Melampodium leucanthum",
        "plant_type": "Perennial",
        "flower_color": "White",
        "height": "1-2 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "gray_green",
        "foliage_type": "evergreen",
        "water_use": "low",
        "bloom_season": ["Spring", "Summer", "Fall"],
        "image_url": "/static/plants/blackfoot-daisy.jpg",
    },
    {
        "id": 14,
        "common_name": "Bird of Paradise",
        "botanical_name": "Caesalpinia pulcherrima",
        "plant_type": "Shrub",
        "flower_color": "Orange",
        "height": "6-10 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "full_sun",
        "leaf_color": "green",
        "foliage_type": "deciduous",
        "water_use": "medium",
        "bloom_season": ["Summer", "Fall"],
        "image_url": "/static/plants/bird-of-paradise.jpg",
    },
    {
        "id": 15,
        "common_name": "Indian Hawthorn",
        "botanical_name": "Rhaphiolepis indica",
        "plant_type": "Shrub",
        "flower_color": "Pink",
        "height": "3-5 ft",
        "sun_exposure": "full sun",
        "shade_tolerance": "partial_shade",
        "leaf_color": "dark_green",
        "foliage_type": "evergreen",
        "water_use": "medium",
        "bloom_season": ["Spring"],
        "image_url": "/static/plants/indian-hawthorn.jpg",
    },
]

hoaLists = [
    {
        "id": 1,
        "name": "Summerlin South",
        "approvedPlantNames": [
            "Lantana",
            "Lavender",
            "Red Yucca",
            "Texas Sage",
            "Agave",
            "Pink Muhly Grass",
            "Deer Grass",
            "Rosemary",
            "Blackfoot Daisy",
        ],
    },
    {
        "id": 2,
        "name": "Anthem",
        "approvedPlantNames": [
            "Lantana",
            "Lavender",
            "Red Yucca",
            "Bougainvillea",
            "Oleander",
            "Agave",
            "Aloe Vera",
            "Ice Plant",
            "Bird of Paradise",
        ],
    },
    {
        "id": 3,
        "name": "Desert Shores",
        "approvedPlantNames": [
            "Lantana",
            "Lavender",
            "Texas Sage",
            "Oleander",
            "Pink Muhly Grass",
            "Deer Grass",
            "Ice Plant",
            "Blackfoot Daisy",
            "Indian Hawthorn",
        ],
    },
    {
        "id": 4,
        "name": "Green Valley Ranch",
        "approvedPlantNames": [
            "Lavender",
            "Red Yucca",
            "Texas Sage",
            "Agave",
            "Aloe Vera",
            "Pink Muhly Grass",
            "Rosemary",
            "Blackfoot Daisy",
        ],
    },
]


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS plants (
                id INTEGER PRIMARY KEY,
                common_name TEXT NOT NULL,
                botanical_name TEXT NOT NULL,
                plant_type TEXT,
                flower_color TEXT,
                height TEXT,
                sun_exposure TEXT,
                shade_tolerance TEXT,
                leaf_color TEXT,
                foliage_type TEXT,
                water_use TEXT,
                bloom_season TEXT,
                image_url TEXT
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS hoas (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS hoa_approved_plants (
                hoa_id INTEGER NOT NULL,
                plant_name TEXT NOT NULL,
                PRIMARY KEY (hoa_id, plant_name),
                FOREIGN KEY (hoa_id) REFERENCES hoas(id)
            )
            """
        )

        existing = conn.execute("SELECT COUNT(*) AS c FROM plants").fetchone()["c"]
        if existing == 0:
            conn.executemany(
                """
                INSERT INTO plants (
                    id, common_name, botanical_name, plant_type, flower_color, height,
                    sun_exposure, shade_tolerance, leaf_color, foliage_type, water_use,
                    bloom_season, image_url
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        p["id"],
                        p["common_name"],
                        p["botanical_name"],
                        p.get("plant_type"),
                        p.get("flower_color"),
                        p.get("height"),
                        p.get("sun_exposure"),
                        p.get("shade_tolerance"),
                        p.get("leaf_color"),
                        p.get("foliage_type"),
                        p.get("water_use"),
                        json.dumps(p.get("bloom_season", [])),
                        p.get("image_url"),
                    )
                    for p in plants
                ],
            )

        existing_hoas = conn.execute("SELECT COUNT(*) AS c FROM hoas").fetchone()["c"]
        if existing_hoas == 0:
            conn.executemany(
                "INSERT INTO hoas (id, name) VALUES (?, ?)",
                [(h["id"], h["name"]) for h in hoaLists],
            )
            links = []
            for hoa in hoaLists:
                for plant_name in hoa.get("approvedPlantNames", []):
                    links.append((hoa["id"], plant_name))
            conn.executemany(
                "INSERT INTO hoa_approved_plants (hoa_id, plant_name) VALUES (?, ?)",
                links,
            )


init_db()


class ChatRequest(BaseModel):
    message: str
    language: str = "en"


class ChatResponse(BaseModel):
    reply: str
    recommended_plants: list[dict[str, Any]] = []


def normalize_enum_value(value: Any) -> str:
    return str(value or "").strip().lower().replace(" ", "_")


def normalize_plant_for_response(plant: dict[str, Any], base_url: str) -> dict[str, Any]:
    normalized_plant = {
        **plant,
        "shade_tolerance": plant.get("shade_tolerance")
        or plant.get("shadeTolerance")
        or plant.get("shade")
        or "",
        "leaf_color": plant.get("leaf_color") or plant.get("leafColor") or "",
        "foliage_type": plant.get("foliage_type")
        or plant.get("foliageType")
        or plant.get("evergreen_deciduous")
        or "",
    }
    image_url = normalized_plant.get("image_url")
    if image_url and image_url.startswith("/"):
        normalized_plant["image_url"] = urljoin(base_url, image_url.lstrip("/"))
    return normalized_plant


def row_to_plant(row: sqlite3.Row) -> dict[str, Any]:
    bloom = row["bloom_season"]
    try:
        bloom_season = json.loads(bloom) if bloom else []
    except json.JSONDecodeError:
        bloom_season = []
    return {
        "id": row["id"],
        "common_name": row["common_name"],
        "botanical_name": row["botanical_name"],
        "plant_type": row["plant_type"] or "",
        "flower_color": row["flower_color"] or "",
        "height": row["height"] or "",
        "sun_exposure": row["sun_exposure"] or "",
        "shade_tolerance": row["shade_tolerance"] or "",
        "leaf_color": row["leaf_color"] or "",
        "foliage_type": row["foliage_type"] or "",
        "water_use": row["water_use"] or "",
        "bloom_season": bloom_season,
        "image_url": row["image_url"] or "",
    }


def search_plants(filters: dict[str, Any], base_url: str) -> list[dict[str, Any]]:
    filtered = []
    hoa_name = (filters.get("hoa_name") or "").strip().lower()
    limit = max(1, min(int(filters.get("limit", 5)), 10))
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM plants").fetchall()
        approved_names = None
        if hoa_name:
            hoa_row = conn.execute(
                "SELECT id FROM hoas WHERE LOWER(name) = LOWER(?)",
                (hoa_name,),
            ).fetchone()
            if hoa_row:
                approved_names = {
                    r["plant_name"]
                    for r in conn.execute(
                        "SELECT plant_name FROM hoa_approved_plants WHERE hoa_id = ?",
                        (hoa_row["id"],),
                    ).fetchall()
                }
            else:
                approved_names = set()

    logger.info("tool.search_plants filters=%s limit=%s", filters, limit)

    for row in rows:
        plant = row_to_plant(row)
        plant_name = plant.get("common_name", "")
        if approved_names is not None and plant_name not in approved_names:
            continue

        plant_type = (filters.get("plant_type") or "").strip().lower()
        if plant_type and str(plant.get("plant_type", "")).lower() != plant_type:
            continue

        flower_color = (filters.get("flower_color") or "").strip().lower()
        plant_flower = str(plant.get("flower_color", "")).lower()
        if flower_color and plant_flower != flower_color:
            continue

        sun_exposure = normalize_enum_value(filters.get("sun_exposure"))
        if sun_exposure and normalize_enum_value(plant.get("sun_exposure")) != sun_exposure:
            continue

        shade = normalize_enum_value(filters.get("shade_tolerance"))
        plant_shade = normalize_enum_value(
            plant.get("shade_tolerance") or plant.get("shadeTolerance") or plant.get("shade")
        )
        if shade and plant_shade != shade:
            continue

        water_use = normalize_enum_value(filters.get("water_use"))
        if water_use and normalize_enum_value(plant.get("water_use")) != water_use:
            continue

        bloom_season = (filters.get("bloom_season") or "").strip().lower()
        seasons = [str(s).lower() for s in (plant.get("bloom_season") or [])]
        if bloom_season and bloom_season not in seasons:
            continue

        filtered.append(normalize_plant_for_response(plant, base_url))

    results = filtered[:limit]
    logger.info(
        "tool.search_plants matched=%s names=%s",
        len(results),
        [p.get("common_name") for p in results],
    )
    return results

@app.get("/")
def read_root():
    return {"message": "Plant pallette backend is running!"}

@app.get("/plants")
def get_plants(request: Request):
    print(">>> /plants endpoint hit")
    base_url = str(request.base_url)
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM plants ORDER BY id ASC").fetchall()
    normalized = [normalize_plant_for_response(row_to_plant(row), base_url) for row in rows]
    return normalized
@app.get("/hoas")
def get_hoa_lists():
    print(">>> /hoas endpoint hit")
    with get_conn() as conn:
        hoa_rows = conn.execute("SELECT id, name FROM hoas ORDER BY id ASC").fetchall()
        results = []
        for hoa in hoa_rows:
            name_rows = conn.execute(
                "SELECT plant_name FROM hoa_approved_plants WHERE hoa_id = ? ORDER BY plant_name ASC",
                (hoa["id"],),
            ).fetchall()
            results.append(
                {
                    "id": hoa["id"],
                    "name": hoa["name"],
                    "approvedPlantNames": [r["plant_name"] for r in name_rows],
                }
            )
    return results


@app.post("/chat", response_model=ChatResponse)
def chat_with_assistant(payload: ChatRequest, request: Request):
    started_at = time.time()
    logger.info("chat.start language=%s message=%s", payload.language, payload.message)
    if not openai_client:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is missing. Please set it in backend/.env.",
        )

    user_text = (payload.message or "").strip()
    if not user_text:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    locale_hint = "Chinese" if payload.language == "zh" else "English"
    system_prompt = (
        "You are a helpful plant assistant for a landscaping palette app with structured tool access. "
        f"Reply in {locale_hint}. Keep answers concise and practical. "
        "When the user asks for plant recommendations, call the search_plants tool even if constraints are partial. "
        "Do not block on missing details. Give a best-effort shortlist first, then ask at most one focused follow-up question. "
        "Do not output Markdown image syntax."
    )
    tools = [
        {
            "type": "function",
            "name": "search_plants",
            "description": "Search plants by filters and return best matches from the catalog.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plant_type": {"type": "string"},
                    "flower_color": {"type": "string"},
                    "sun_exposure": {"type": "string"},
                    "shade_tolerance": {"type": "string"},
                    "water_use": {"type": "string"},
                    "bloom_season": {"type": "string"},
                    "hoa_name": {"type": "string"},
                    "limit": {"type": "integer", "minimum": 1, "maximum": 10},
                },
                "required": [],
                "additionalProperties": False,
            },
        }
    ]
    recommended_plants: list[dict[str, Any]] = []
    base_url = str(request.base_url)

    try:
        first_response = openai_client.responses.create(
            model=MODEL_NAME,
            input=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_text},
            ],
            tools=tools,
        )

        tool_outputs = []
        for item in getattr(first_response, "output", []):
            if getattr(item, "type", "") != "function_call":
                continue
            if getattr(item, "name", "") != "search_plants":
                continue
            arguments_raw = getattr(item, "arguments", "") or "{}"
            logger.info("chat.tool_call name=%s arguments_raw=%s", item.name, arguments_raw)
            try:
                arguments = json.loads(arguments_raw)
            except json.JSONDecodeError:
                arguments = {}
                logger.warning("chat.tool_call invalid_json arguments_raw=%s", arguments_raw)

            recommended_plants = search_plants(arguments, base_url)
            tool_outputs.append(
                {
                    "type": "function_call_output",
                    "call_id": item.call_id,
                    "output": json.dumps(
                        {
                            "count": len(recommended_plants),
                            "plants": recommended_plants,
                        }
                    ),
                }
            )

        response = first_response
        if tool_outputs:
            response = openai_client.responses.create(
                model=MODEL_NAME,
                previous_response_id=first_response.id,
                input=tool_outputs,
            )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {exc}") from exc

    reply_text = (response.output_text or "").strip()
    if not reply_text:
        reply_text = (
            "I could not generate a response this time. Please try again."
            if payload.language != "zh"
            else "这次没有成功生成回复，请再试一次。"
        )
    elapsed_ms = int((time.time() - started_at) * 1000)
    logger.info(
        "chat.done recommended_count=%s elapsed_ms=%s reply_preview=%s",
        len(recommended_plants),
        elapsed_ms,
        reply_text[:140],
    )
    return ChatResponse(reply=reply_text, recommended_plants=recommended_plants)
