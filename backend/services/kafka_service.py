import json
import os

from dotenv import load_dotenv
from kafka import KafkaConsumer, KafkaProducer


load_dotenv()


KAFKA_BOOTSTRAP_SERVERS = os.getenv(
    "KAFKA_BOOTSTRAP_SERVERS",
    "localhost:9092"
)


def create_producer():
    """
    Crée un producteur Kafka.
    """

    return KafkaProducer(
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_serializer=lambda value: json.dumps(value).encode("utf-8")
    )


def create_consumer(topic, group_id):
    """
    Crée un consommateur Kafka pour un topic donné.
    """

    return KafkaConsumer(
        topic,
        bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
        value_deserializer=lambda value: json.loads(
            value.decode("utf-8")
        ),
        group_id=group_id,
        auto_offset_reset="latest"
    )