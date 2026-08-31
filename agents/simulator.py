import json
import math
import random
import time
from datetime import datetime
from kafka import KafkaProducer

KAFKA_BOOTSTRAP_SERVERS = 'localhost:9092'
TOPIC_NAME = 'eeg-raw'
CHANNELS = 16
SAMPLING_RATE = 256  # Hz

def create_kafka_producer():
    """Tente de se connecter à Kafka avec reprise sur erreur."""
    print(" Connexion au broker Kafka...")
    while True:
        try:
            producer = KafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            print(" Connecté à Kafka avec succès !")
            return producer
        except Exception as e:
            print(f" Broker Kafka non disponible ({e}), nouvelle tentative dans 3 secondes...")
            time.sleep(3)

def generate_eeg_sample(step: int, patient_id: str = "PAT-2026-001", is_critical: bool = False):
    """Génère un paquet de données EEG simulé pour 16 canaux."""
    channels_data = []
    
    for ch in range(CHANNELS):
        # Onde sinusoïdale de base + bruit aléatoire
        base_freq = 0.05 + (ch * 0.01)
        val = (math.sin(step * base_freq) * 15) + (math.cos(step * 0.1) * 5)
        
        # Injection d'anomalies (crise d'épilepticité simulée) si état critique
        if is_critical and random.random() > 0.6:
            val += (random.random() - 0.5) * 120  # Forte amplitude (>100µV)
        else:
            val += (random.random() - 0.5) * 6
            
        channels_data.append(round(val, 2))

    return {
        "patient_id": patient_id,
        "timestamp": datetime.utcnow().isoformat(),
        "step": step,
        "channels": channels_data,
        "channel_count": CHANNELS,
        "sampling_rate": SAMPLING_RATE
    }

def run_simulator():
    producer = create_kafka_producer()
    step = 0
    print(f" Émission des signaux EEG vers le topic Kafka '{TOPIC_NAME}'...")

    try:
        while True:
            # Simule ponctuellement des crises d'épilepsie néonatales
            is_critical = (step % 200 > 150)
            
            payload = generate_eeg_sample(step=step, patient_id="PAT-2026-001", is_critical=is_critical)
            
            producer.send(TOPIC_NAME, value=payload)
            
            if step % 50 == 0:
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Message #{step} envoyé | Status: {' CRITIQUE (Spike)' if is_critical else ' NORMAL'}")

            step += 1
            time.sleep(1 / 10)  # 10 paquets par seconde
            
    except KeyboardInterrupt:
        print("\n Arrêt du simulateur EEG.")
        producer.close()

if __name__ == "__main__":
    run_simulator()