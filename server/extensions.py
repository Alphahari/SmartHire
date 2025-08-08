from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

cache = Cache()

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv('REDIS_URL', 'redis://localhost:6380/0')
)
