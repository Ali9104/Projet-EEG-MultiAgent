import math
import random
import time
from datetime import datetime, timezone

from .config import (
    CHANNEL_COUNT,
    MESSAGE_INTERVAL,
    PATIENT_IDS,
    SAMPLING_RATE
)
from .producer import EEGProducer
from agents.common.heartbeat import AgentHeartbeat


class AcquisitionAgent:

    def __init__(self):
        self.producer = EEGProducer()

        # Un compteur indépendant pour chaque patient
        self.steps = {
            patient_id: 0
            for patient_id in PATIENT_IDS
        }

    def generate_eeg_sample(self, patient_id):

        step = self.steps[patient_id]

        channels = []

        is_critical = (step % 200 > 150)

        for channel in range(CHANNEL_COUNT):

            base_frequency = 0.05 + (channel * 0.01)

            value = (
                math.sin(step * base_frequency) * 15
                + math.cos(step * 0.1) * 5
            )

            if is_critical:
                value += random.choice([-1, 1]) * random.uniform(90, 130)
            else:
                value += random.uniform(-3, 3)

            channels.append(round(value, 2))

        self.steps[patient_id] += 1

        return {
            "patient_id": patient_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "step": step,
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

        heartbeat = AgentHeartbeat("acquisition")
        heartbeat.start()

        try:

            while True:

                # Générer une donnée pour chaque patient
                for patient_id in PATIENT_IDS:

                    data = self.generate_eeg_sample(patient_id)

                    self.producer.send(data)

                    if data["step"] % 50 == 0:

                        print(
                            f"EEG #{data['step']} envoyé | "
                            f"Patient: {patient_id}"
                        )

                time.sleep(MESSAGE_INTERVAL)

        except KeyboardInterrupt:

            print("\nArrêt de l'Agent d'Acquisition.")

        finally:

            self.producer.close()


if __name__ == "__main__":
    agent = AcquisitionAgent()
    agent.run()