from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.kafka_service import create_producer
from bson import ObjectId
from fastapi import HTTPException


router = APIRouter(
    prefix="/api/eeg",
    tags=["EEG"]
)


class EEGData(BaseModel):
    patient_id: str
    timestamp: str
    step: int
    channels: list[float] = Field(min_length=1)
    channel_count: int
    sampling_rate: int


@router.post("")
def receive_eeg(data: EEGData):
    producer = create_producer()

    try:
        message = data.model_dump()

        producer.send(
            "eeg-raw",
            value=message
        )

        producer.flush()

        return {
            "message": "EEG reçu et envoyé vers Kafka",
            "topic": "eeg-raw",
            "patient_id": data.patient_id,
            "step": data.step
        }

    finally:
        producer.close()

@router.get("/patients")
def get_patients():
    from backend.services.mongo_service import create_client, get_database

    client = create_client()

    try:
        db = get_database(client)

        patients = db.eeg_data.distinct("patient_id")

        return {
            "count": len(patients),
            "patients": patients
        }

    finally:
        client.close()

@router.get("/alerts")
def get_alerts():
    from backend.services.mongo_service import create_client, get_database

    client = create_client()

    try:
        db = get_database(client)

        alerts = list(
            db.eeg_data.find(
                {"priority": "CRITIQUE"},
                {
                    "_id": 1,
                    "patient_id": 1,
                    "timestamp": 1,
                    "step": 1,
                    "priority": 1,
                    "max_amplitude": 1
                }
            ).sort("stored_at", -1)
        )

        for alert in alerts:
            alert["_id"] = str(alert["_id"])

        return {
            "count": len(alerts),
            "alerts": alerts
        }

    finally:
        client.close()

@router.get("/dashboard")
def get_dashboard():
    from backend.services.mongo_service import create_client, get_database

    client = create_client()

    try:
        db = get_database(client)

        total_eeg = db.eeg_data.count_documents({})
        total_patients = len(db.eeg_data.distinct("patient_id"))
        total_alerts = db.eeg_data.count_documents({"priority": "CRITIQUE"})
        total_normal = db.eeg_data.count_documents({"priority": "NORMAL"})
        total_archived = db.eeg_data.count_documents({"archived": True})

        return {
            "patients": total_patients,
            "total_eeg": total_eeg,
            "alerts": total_alerts,
            "normal": total_normal,
            "archived": total_archived
        }

    finally:
        client.close()

@router.get("/{id}")
def get_eeg(id: str):
    from backend.services.mongo_service import create_client, get_database

    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=400,
            detail="ID MongoDB invalide"
        )

    client = create_client()

    try:
        db = get_database(client)

        eeg = db.eeg_data.find_one({
            "_id": ObjectId(id)
        })

        if eeg is None:
            raise HTTPException(
                status_code=404,
                detail="EEG introuvable"
            )

        eeg["_id"] = str(eeg["_id"])

        return eeg

    finally:
        client.close()