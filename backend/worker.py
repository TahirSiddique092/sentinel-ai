import redis
import threading
import uvicorn
import os
from fastapi import FastAPI
from rq import Worker
from app.config import settings

app = FastAPI()

@app.get("/health")
async def health():
    return {"status": "worker is running"}

def run_health_check():
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    threading.Thread(target=run_health_check, daemon=True).start()

    conn = redis.from_url(settings.REDIS_URL)
    
    worker = Worker(["sentinelai-scans"], connection=conn)
    
    print("✓ Starting SentinelAI Background Worker via FastAPI Web Service")
    worker.work()