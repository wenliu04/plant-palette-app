from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
# Allow CORS for all origins (you can restrict this in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
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
        "bloom_season": "Spring",
        "hoa": "HOA A",
        "image_url": "https://via.placeholder.com/200x140?text=Red+Yucca",
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
        "bloom_season": "Fall",
        "hoa": "HOA B",
        "image_url": "https://via.placeholder.com/200x140?text=Lantana",
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
        "bloom_season": "Summer",
        "hoa": "HOA A",
        "image_url": "https://via.placeholder.com/200x140?text=Lavender",
    },
]

@app.get("/")
def read_root():
    return {"message": "Plant pallette backend is running!"}

@app.get("/plants")
def get_plants():
    print(">>> /plants endpoint hit")
    return plants