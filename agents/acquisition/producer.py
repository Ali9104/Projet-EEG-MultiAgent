from backend.services.kafka_service import create_producer

from .config import OUTPUT_TOPIC


class EEGProducer:

    def __init__(self):
        self.producer = create_producer()

    def send(self, data):
        self.producer.send(
            OUTPUT_TOPIC,
            value=data
        )

    def close(self):
        self.producer.flush()
        self.producer.close()