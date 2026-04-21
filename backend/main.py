from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import init_db
from routers import notebooks, sources, chat

app = FastAPI(title="NotebookLM Clone", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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