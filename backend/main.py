from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from fastapi.staticfiles import StaticFiles


app = FastAPI()
# Allow CORS for all origins (you can restrict this in production)
origins = [
    "*"
]
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
plants = [
    {
        "id": 1,
        "common_name": "Red Yucca",
        "botanical_name": "Hesperaloe parviflora",
        "plant_type": "Succulent",
        "flower_color": "Red",
        "height": "3-4 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Spring", "Summer"],
        "image_url": "http://localhost:8000/static/plants/red-yucca.jpg",
    },
    {
        "id": 2,
        "common_name": "Lantana",
        "botanical_name": "Lantana camara",
        "plant_type": "Shrub",
        "flower_color": "Yellow",
        "height": "2-4 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Summer", "Fall"],
        "image_url": "http://localhost:8000/static/plants/lantana.jpg",
    },
    {
        "id": 3,
        "common_name": "Lavender",
        "botanical_name": "Lavandula angustifolia",
        "plant_type": "Shrub",
        "flower_color": "Purple",
        "height": "2-3 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Spring", "Summer"],
        "image_url": "http://localhost:8000/static/plants/lavender.jpg",
    },
    {
        "id": 4,
        "common_name": "Texas Sage",
        "botanical_name": "Leucophyllum frutescens",
        "plant_type": "Shrub",
        "flower_color": "Purple",
        "height": "4-6 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Summer", "Fall"],
        "image_url": "http://localhost:8000/static/plants/texas-sage.jpg",
    },
    {
        "id": 5,
        "common_name": "Bougainvillea",
        "botanical_name": "Bougainvillea spp.",
        "plant_type": "Vine",
        "flower_color": "Pink",
        "height": "6-10 ft",
        "sun_exposure": "full sun",
        "water_use": "medium",
        "bloom_season": ["Spring", "Summer", "Fall"],
        "image_url": "http://localhost:8000/static/plants/bougainvillea.jpg",
    },
    {
        "id": 6,
        "common_name": "Oleander",
        "botanical_name": "Nerium oleander",
        "plant_type": "Shrub",
        "flower_color": "Pink",
        "height": "6-12 ft",
        "sun_exposure": "full sun",
        "water_use": "medium",
        "bloom_season": ["Spring", "Summer", "Fall"],
        "image_url": "http://localhost:8000/static/plants/oleander.jpg",
    },
    {
        "id": 7,
        "common_name": "Agave",
        "botanical_name": "Agave americana",
        "plant_type": "Succulent",
        "flower_color": "",
        "height": "4-6 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Summer"],
        "image_url": "http://localhost:8000/static/plants/agave.jpg",
    },
    {
        "id": 8,
        "common_name": "Aloe Vera",
        "botanical_name": "Aloe barbadensis",
        "plant_type": "Succulent",
        "flower_color": "Yellow",
        "height": "1-2 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Winter", "Spring"],
        "image_url": "http://localhost:8000/static/plants/aloe-vera.jpg",
    },
    {
        "id": 9,
        "common_name": "Pink Muhly Grass",
        "botanical_name": "Muhlenbergia capillaris",
        "plant_type": "Grass",
        "flower_color": "Pink",
        "height": "2-3 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Fall"],
        "image_url": "http://localhost:8000/static/plants/pink-muhly-grass.jpg",
    },
    {
        "id": 10,
        "common_name": "Deer Grass",
        "botanical_name": "Muhlenbergia rigens",
        "plant_type": "Grass",
        "flower_color": "",
        "height": "3-4 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Fall"],
        "image_url": "http://localhost:8000/static/plants/deer-grass.jpg",
    },
    {
        "id": 11,
        "common_name": "Rosemary",
        "botanical_name": "Salvia rosmarinus",
        "plant_type": "Groundcover",
        "flower_color": "Blue",
        "height": "1-2 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Winter", "Spring"],
        "image_url": "http://localhost:8000/static/plants/rosemary.jpg",
    },
    {
        "id": 12,
        "common_name": "Ice Plant",
        "botanical_name": "Delosperma cooperi",
        "plant_type": "Groundcover",
        "flower_color": "Purple",
        "height": "0.5-1 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Spring", "Summer"],
        "image_url": "http://localhost:8000/static/plants/ice-plant.jpg",
    },
    {
        "id": 13,
        "common_name": "Blackfoot Daisy",
        "botanical_name": "Melampodium leucanthum",
        "plant_type": "Perennial",
        "flower_color": "White",
        "height": "1-2 ft",
        "sun_exposure": "full sun",
        "water_use": "low",
        "bloom_season": ["Spring", "Summer", "Fall"],
        "image_url": "http://localhost:8000/static/plants/blackfoot-daisy.jpg",
    },
    {
        "id": 14,
        "common_name": "Bird of Paradise",
        "botanical_name": "Caesalpinia pulcherrima",
        "plant_type": "Shrub",
        "flower_color": "Orange",
        "height": "6-10 ft",
        "sun_exposure": "full sun",
        "water_use": "medium",
        "bloom_season": ["Summer", "Fall"],
        "image_url": "http://localhost:8000/static/plants/bird-of-paradise.jpg",
    },
    {
        "id": 15,
        "common_name": "Indian Hawthorn",
        "botanical_name": "Rhaphiolepis indica",
        "plant_type": "Shrub",
        "flower_color": "Pink",
        "height": "3-5 ft",
        "sun_exposure": "full sun",
        "water_use": "medium",
        "bloom_season": ["Spring"],
        "image_url": "http://localhost:8000/static/plants/indian-hawthorn.jpg",
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

@app.get("/")
def read_root():
    return {"message": "Plant pallette backend is running!"}

@app.get("/plants")
def get_plants():
    print(">>> /plants endpoint hit")
    return plants
@app.get("/hoas")
def get_hoa_lists():
    print(">>> /hoas endpoint hit")
    return hoaLists
