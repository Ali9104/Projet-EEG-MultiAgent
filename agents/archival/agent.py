import os
import time

from backend.services.mongo_service import (
    create_client as create_mongo_client,
    get_database
)

from backend.services.minio_service import (
    create_client as create_minio_client,
    create_bucket,
    upload_json
)

from .archival_policy import is_old
from agents.common.heartbeat import AgentHeartbeat


class ArchivalAgent:

    def __init__(self):

        # MongoDB
        self.mongo_client = create_mongo_client()
        self.db = get_database(self.mongo_client)

        print("MongoDB connecté.")

        # MinIO
        self.minio_client = create_minio_client()
        create_bucket(self.minio_client)

        print("MinIO connecté.")

        # Vérification périodique
        self.interval = int(
            os.getenv("ARCHIVAL_INTERVAL_SECONDS", "300")
        )

    def archive_document(self, document):

        patient_id = document.get("patient_id")
        step = document.get("step")

        object_name = (
            f"archive/{patient_id}/"
            f"eeg-{step}.json"
        )

        data = {
            "patient_id": patient_id,
            "timestamp": document.get("timestamp"),
            "step": step,
            "priority": document.get("priority"),
            "max_amplitude": document.get("max_amplitude"),
            "channels": document.get("channels", []),
            "channel_count": document.get("channel_count"),
            "sampling_rate": document.get("sampling_rate"),
            "archived": True
        }

        upload_json(
            self.minio_client,
            data,
            object_name
        )

        return object_name

    def archive_old_data(self):

        documents = self.db.eeg_data.find(
            {"archived": {"$ne": True}}
        )

        archived_count = 0

        for document in documents:

            timestamp = document.get("timestamp")

            if not is_old(timestamp):
                continue

            object_name = self.archive_document(document)

            self.db.eeg_data.update_one(
                {"_id": document["_id"]},
                {
                    "$set": {
                        "archived": True,
                        "archive_object": object_name
                    }
                }
            )

            archived_count += 1

            print(
                f"[ARCHIVAGE] "
                f"Patient: {document.get('patient_id')} | "
                f"Step: {document.get('step')} → "
                f"{object_name}"
            )

        print("----------------------------------------")
        print(f"EEG archivés pendant cette passe : {archived_count}")
        print("----------------------------------------")

        return archived_count

    def run(self):

        print("========================================")
        print("        AGENT D'ARCHIVAGE EEG")
        print("========================================")
        print(
            f"Vérification toutes les "
            f"{self.interval} secondes."
        )

        heartbeat = AgentHeartbeat("archival")
        heartbeat.start()

        try:
            while True:

                print("\n[ARCHIVAGE] Nouvelle vérification...")

                self.archive_old_data()

                print(
                    f"[ARCHIVAGE] Prochaine vérification dans "
                    f"{self.interval} secondes."
                )

                time.sleep(self.interval)

        except KeyboardInterrupt:
            print("\nArrêt de l'Agent d'Archivage.")

        finally:
            heartbeat.stop()

    def close(self):

        self.mongo_client.close()


if __name__ == "__main__":

    agent = ArchivalAgent()

    try:
        agent.run()
    finally:
        agent.close()