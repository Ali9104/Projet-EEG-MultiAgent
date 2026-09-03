import json
from datetime import datetime

from kafka import KafkaConsumer
from pymongo import MongoClient
import redis


KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"
INPUT_TOPIC = "eeg-priority"

MONGO_URI = "mongodb://root:rootpassword@localhost:27017/"
MONGO_DATABASE = "eeg_database"

REDIS_HOST = "localhost"
REDIS_PORT = 6379


def connect_mongodb():
    print("Connexion à MongoDB...")

    client = MongoClient(MONGO_URI)
    db = client[MONGO_DATABASE]

    print("MongoDB connecté.")

    return client, db


def connect_redis():
    print("Connexion à Redis...")

    client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        decode_responses=True
    )

    client.ping()

    print("Redis connecté.")

    return client


def create_consumer():
    consumer = KafkaConsumer(
        INPUT_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        group_id="decision-agent",
        auto_offset_reset="latest"
    )

    return consumer


def store_in_mongodb(db, data):
    document = {
        "patient_id": data.get("patient_id"),
        "timestamp": data.get("timestamp"),
        "step": data.get("step"),
        "priority": data.get("priority"),
        "max_amplitude": data.get("max_amplitude"),
        "stored_at": datetime.utcnow()
    }

    db.eeg_data.insert_one(document)


def store_in_redis(redis_client, data):
    patient_id = data.get("patient_id")

    key = f"eeg:critical:{patient_id}"

    redis_client.set(
        key,
        json.dumps(data),
        ex=3600
    )


def process_message(db, redis_client, data):
    priority = data.get("priority")
    patient_id = data.get("patient_id")

    if priority == "CRITIQUE":

        print(
            f"[DECISION] {patient_id} → CRITIQUE | "
            f"MongoDB + Redis + MinIO"
        )

        # MongoDB
        store_in_mongodb(db, data)

        # Redis
        store_in_redis(redis_client, data)

        # MinIO sera ajouté à l'étape suivante

    else:

        print(
            f"[DECISION] {patient_id} → NORMAL | "
            f"MongoDB + MinIO"
        )

        # MongoDB
        store_in_mongodb(db, data)

        # MinIO sera ajouté à l'étape suivante


def run():

    print("========================================")
    print("       AGENT DE DECISION EEG")
    print("========================================")

    mongo_client, db = connect_mongodb()
    redis_client = connect_redis()

    consumer = create_consumer()

    print("Agent de Décision démarré.")
    print(f"Écoute du topic Kafka '{INPUT_TOPIC}'...")

    try:

        for message in consumer:

            data = message.value

            process_message(
                db,
                redis_client,
                data
            )

    except KeyboardInterrupt:

        print("\nArrêt de l'Agent de Décision.")

    finally:

        consumer.close()
        mongo_client.close()


if __name__ == "__main__":
    run()