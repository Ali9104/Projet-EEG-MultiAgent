import io
import json
import os

from dotenv import load_dotenv
from minio import Minio

load_dotenv()

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadminpassword")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "eeg-data")


def create_client():
    return Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=MINIO_SECURE
    )


def create_bucket(client):
    if not client.bucket_exists(MINIO_BUCKET):
        client.make_bucket(MINIO_BUCKET)


def upload_json(client, data, object_name):
    payload = json.dumps(
        data,
        ensure_ascii=False
    ).encode("utf-8")

    client.put_object(
        MINIO_BUCKET,
        object_name,
        io.BytesIO(payload),
        length=len(payload),
        content_type="application/json"
    )


def test_connection():
    client = create_client()
    create_bucket(client)

    print("MinIO service OK")
    print(f"Bucket : {MINIO_BUCKET}")