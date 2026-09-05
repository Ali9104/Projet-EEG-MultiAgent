from backend.services.kafka_service import create_consumer

INPUT_TOPIC = "eeg-priority"
GROUP_ID = "decision-agent"


def create_decision_consumer():
    return create_consumer(
        topic=INPUT_TOPIC,
        group_id=GROUP_ID
    )