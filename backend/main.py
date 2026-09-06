from fastapi import FastAPI

from backend.api.routes.eeg import router as eeg_router
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="EEG Multi-Agent System",
    description="API de gestion des EEG néonataux",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(eeg_router)


@app.get("/")
def root():
    return {
        "message": "EEG Multi-Agent API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }