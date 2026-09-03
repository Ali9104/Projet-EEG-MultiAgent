import json
from kafka import KafkaConsumer, KafkaProducer

KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"

INPUT_TOPIC = "eeg-raw"
OUTPUT_TOPIC = "eeg-priority"


def create_consumer():
    print("Connexion à Kafka...")

    consumer = KafkaConsumer(
        INPUT_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        group_id="acquisition-agent",
        auto_offset_reset="latest"
    )

    print(f"Connecté à Kafka. Écoute du topic '{INPUT_TOPIC}'...")
    return consumer


def create_producer():
    return KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda v: json.dumps(v).encode("utf-8")
    )


def calculate_priority(data):
    """
    Analyse simple du signal EEG.
    Pour l'instant :
    - amplitude élevée -> CRITIQUE
    - sinon -> NORMAL
    """

    channels = data.get("channels", [])

    if not channels:
        return "NORMAL"

    max_amplitude = max(abs(value) for value in channels)

    if max_amplitude > 80:
        return "CRITIQUE"

    return "NORMAL"


def run():
    consumer = create_consumer()
    producer = create_producer()

    print("Agent d'Acquisition démarré.")

    try:
        for message in consumer:
            data = message.value

            priority = calculate_priority(data)

            result = {
                "patient_id": data.get("patient_id"),
                "timestamp": data.get("timestamp"),
                "priority": priority,
                "max_amplitude": max(
                    abs(value) for value in data.get("channels", [])
                ),
                "step": data.get("step")
            }

            producer.send(OUTPUT_TOPIC, value=result)

            print(
                f"EEG reçu | "
                f"Patient: {result['patient_id']} | "
                f"Step: {result['step']} | "
                f"Priorité: {priority}"
            )

    except KeyboardInterrupt:
        print("\nArrêt de l'Agent d'Acquisition.")

    finally:
        consumer.close()
        producer.close()


if __name__ == "__main__":
    run()