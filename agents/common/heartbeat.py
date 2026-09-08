import os
import threading
import time

import redis
from dotenv import load_dotenv

load_dotenv()


class AgentHeartbeat:
    def __init__(self, agent_name, interval=5, ttl=15):
        self.agent_name = agent_name
        self.interval = interval
        self.ttl = ttl

        self.redis_host = os.getenv("REDIS_HOST", "localhost")
        self.redis_port = int(os.getenv("REDIS_PORT", "6379"))

        self.redis_client = redis.Redis(
            host=self.redis_host,
            port=self.redis_port,
            decode_responses=True,
        )

        self.running = False
        self.thread = None

    def send_heartbeat(self):
        key = f"agent:heartbeat:{self.agent_name}"

        self.redis_client.set(
            key,
            "active",
            ex=self.ttl,
        )

    def _run(self):
        while self.running:
            try:
                self.send_heartbeat()
            except Exception as error:
                print(
                    f"[Heartbeat:{self.agent_name}] "
                    f"Redis indisponible : {error}"
                )

            time.sleep(self.interval)

    def start(self):
        if self.running:
            return

        self.running = True

        self.thread = threading.Thread(
            target=self._run,
            daemon=True,
        )

        self.thread.start()

        print(
            f"[Heartbeat:{self.agent_name}] "
            f"Heartbeat démarré"
        )

    def stop(self):
        self.running = False