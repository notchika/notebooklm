from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import init_db
from routers import notebooks, sources, chat
import os

app = FastAPI(title="NotebookLM Clone", version="1.0.0")

cors_allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [
    origin.strip()
    for origin in cors_allowed_origins.split(",")
    if origin.strip()
]
allow_origin_regex = os.getenv("CORS_ALLOW_ORIGIN_REGEX")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notebooks.router, prefix="/notebooks", tags=["Notebooks"])
app.include_router(sources.router, prefix="/sources", tags=["Sources"])
app.include_router(chat.router, prefix="/chat", tags=["Chat"])

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"status": "NotebookLM backend is running 🚀"}