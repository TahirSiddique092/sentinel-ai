import redis
from rq import Worker
from app.config import settings

if __name__ == "__main__":
    conn = redis.from_url(settings.REDIS_URL)
    worker = Worker(["sentinelai-scans"], connection=conn)
    worker.work()