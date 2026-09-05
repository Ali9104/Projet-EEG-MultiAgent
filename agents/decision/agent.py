import json
from datetime import datetime, timezone

from backend.services.minio_service import (
    create_client as create_minio_client,
    create_bucket,
    upload_json
)

from backend.services.redis_service import (
    create_client as create_redis_client
)

from backend.services.mongo_service import (
    create_client as create_mongo_client,
    get_database
)

from .consumer import create_decision_consumer
from .storage_policy import get_storage_policy


class DecisionAgent:

    def __init__(self):

        # Kafka
        self.consumer = create_decision_consumer()

        # MongoDB
        self.mongo_client = create_mongo_client()
        self.db = get_database(self.mongo_client)

        print("MongoDB connecté.")

        # MinIO
        self.minio_client = create_minio_client()
        create_bucket(self.minio_client)

        print("MinIO connecté.")

        # Redis
        self.redis_client = create_redis_client()
        self.redis_client.ping()

        print("Redis connecté.")

    def store_in_mongodb(self, data):

        document = {
            "patient_id": data.get("patient_id"),
            "timestamp": data.get("timestamp"),
            "step": data.get("step"),
            "priority": data.get("priority"),
            "max_amplitude": data.get("max_amplitude"),
            "channels": data.get("channels", []),
            "channel_count": data.get("channel_count"),
            "sampling_rate": data.get("sampling_rate"),
            "stored_at": datetime.now(timezone.utc)
        }

        self.db.eeg_data.insert_one(document)

    def store_in_minio(self, data):

        patient_id = data.get("patient_id")
        step = data.get("step")

        object_name = (
            f"eeg/{patient_id}/"
            f"eeg-{step}.json"
        )

        upload_json(
            self.minio_client,
            data,
            object_name
        )

        return object_name

    def store_in_redis(self, data):

        patient_id = data.get("patient_id")
        step = data.get("step")

        key = f"eeg:critical:{patient_id}:{step}"

        self.redis_client.set(
            key,
            json.dumps(data),
            ex=3600
        )

        return key

    def process(self, data):

        patient_id = data.get("patient_id")
        priority = data.get("priority")

        storage = get_storage_policy(priority)

        print(
            f"[DECISION] "
            f"Patient: {patient_id} | "
            f"Step: {data.get('step')} | "
            f"Priorité: {priority}"
        )

        # MongoDB
        if "mongodb" in storage:

            self.store_in_mongodb(data)

            print(
                f"[MONGODB] "
                f"EEG #{data.get('step')} enregistré."
            )

        # MinIO
        if "minio" in storage:

            object_name = self.store_in_minio(data)

            print(
                f"[MINIO] "
                f"EEG #{data.get('step')} enregistré → "
                f"{object_name}"
            )

        # Redis uniquement pour les données critiques
        if "redis" in storage:

            redis_key = self.store_in_redis(data)

            print(
                f"[REDIS] "
                f"EEG critique #{data.get('step')} enregistré → "
                f"{redis_key}"
            )

        print(
            f"[STOCKAGE] → "
            f"{' + '.join(storage)}"
        )

    def run(self):

        print("========================================")
        print("       AGENT DE DECISION EEG")
        print("========================================")
        print("Écoute du topic : eeg-priority")

        try:

            for message in self.consumer:

                self.process(message.value)

        except KeyboardInterrupt:

            print("\nArrêt de l'Agent de Décision.")

        finally:

            self.consumer.close()
            self.mongo_client.close()
            self.redis_client.close()


if __name__ == "__main__":
    agent = DecisionAgent()
    agent.run()