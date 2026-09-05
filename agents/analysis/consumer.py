from backend.services.kafka_service import create_consumer


INPUT_TOPIC = "eeg-raw"
GROUP_ID = "analysis-agent"


def create_eeg_consumer():
    return create_consumer(
        topic=INPUT_TOPIC,
        group_id=GROUP_ID
    )