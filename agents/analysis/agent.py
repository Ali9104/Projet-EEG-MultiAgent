from backend.services.kafka_service import create_producer

from .consumer import create_eeg_consumer
from .analyzer import analyze_eeg


OUTPUT_TOPIC = "eeg-priority"
ALERT_TOPIC = "eeg-alerts"


class AnalysisAgent:

    def __init__(self):
        self.consumer = create_eeg_consumer()
        self.producer = create_producer()

    def process(self, data):

        analysis = analyze_eeg(data)

        result = {
            **data,
            "priority": analysis["priority"],
            "max_amplitude": analysis["max_amplitude"]
        }

        # Résultat de l'analyse
        self.producer.send(
            OUTPUT_TOPIC,
            value=result
        )

        print(
            f"[ANALYSE] "
            f"Patient: {data.get('patient_id')} | "
            f"Step: {data.get('step')} | "
            f"Amplitude: {analysis['max_amplitude']} | "
            f"Priorité: {analysis['priority']}"
        )

        # Alerte si le signal est critique
        if analysis["priority"] == "CRITIQUE":

            alert = {
                "patient_id": data.get("patient_id"),
                "timestamp": data.get("timestamp"),
                "step": data.get("step"),
                "priority": "CRITIQUE",
                "max_amplitude": analysis["max_amplitude"],
                "message": "Anomalie EEG détectée"
            }

            self.producer.send(
                ALERT_TOPIC,
                value=alert
            )

            print(
                f"[ALERTE] "
                f"Patient: {data.get('patient_id')} "
                f"→ ANOMALIE CRITIQUE"
            )

    def run(self):

        print("========================================")
        print("          AGENT D'ANALYSE EEG")
        print("========================================")
        print("Écoute du topic : eeg-raw")

        try:

            for message in self.consumer:

                self.process(message.value)

        except KeyboardInterrupt:

            print("\nArrêt de l'Agent d'Analyse.")

        finally:

            self.consumer.close()
            self.producer.close()


if __name__ == "__main__":
    agent = AnalysisAgent()
    agent.run()