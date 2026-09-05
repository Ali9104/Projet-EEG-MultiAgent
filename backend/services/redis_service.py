import os

import redis
from dotenv import load_dotenv


load_dotenv()


REDIS_HOST = os.getenv(
    "REDIS_HOST",
    "localhost"
)

REDIS_PORT = int(
    os.getenv(
        "REDIS_PORT",
        "6379"
    )
)


def create_client():
    """
    Crée une connexion vers Redis.
    """
    return redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        decode_responses=True
    )


def test_connection():
    """
    Vérifie que Redis est accessible.
    """
    client = create_client()

    try:
        client.ping()
        print("Redis service OK")
    finally:
        client.close()