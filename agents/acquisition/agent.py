import math
import random
import time
from datetime import datetime, timezone

from .config import (
    CHANNEL_COUNT,
    MESSAGE_INTERVAL,
    PATIENT_ID,
    SAMPLING_RATE
)
from .producer import EEGProducer


class AcquisitionAgent:

    def __init__(self):
        self.producer = EEGProducer()
        self.step = 0

    def generate_eeg_sample(self):
        channels = []

        is_critical = (self.step % 200 > 150)

        for channel in range(CHANNEL_COUNT):

            base_frequency = 0.05 + (channel * 0.01)

            value = (
            math.sin(self.step * base_frequency) * 15
            + math.cos(self.step * 0.1) * 5
            )

            if is_critical:
                value += random.choice([-1, 1]) * random.uniform(90, 130)
            else:
                value += random.uniform(-3, 3)

            channels.append(round(value, 2))

        return {
        "patient_id": PATIENT_ID,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "step": self.step,
        "channels": channels,
        "channel_count": CHANNEL_COUNT,
        "sampling_rate": SAMPLING_RATE
        }

    def run(self):

        print("========================================")
        print("       AGENT D'ACQUISITION EEG")
        print("========================================")
        print("Agent démarré.")
        print("Publication vers Kafka : eeg-raw")

        try:

            while True:

                data = self.generate_eeg_sample()

                self.producer.send(data)

                if self.step % 50 == 0:

                    print(
                        f"EEG #{self.step} envoyé | "
                        f"Patient: {PATIENT_ID}"
                    )

                self.step += 1

                time.sleep(MESSAGE_INTERVAL)

        except KeyboardInterrupt:

            print("\nArrêt de l'Agent d'Acquisition.")

        finally:

            self.producer.close()


if __name__ == "__main__":
    agent = AcquisitionAgent()
    agent.run()