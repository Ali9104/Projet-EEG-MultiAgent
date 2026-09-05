import os

from dotenv import load_dotenv
from pymongo import MongoClient


load_dotenv()


MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://root:rootpassword@localhost:27017/"
)

MONGO_DATABASE = os.getenv(
    "MONGO_DATABASE",
    "eeg_database"
)


def create_client():
    """
    Crée une connexion vers MongoDB.
    """
    return MongoClient(MONGO_URI)


def get_database(client):
    """
    Retourne la base de données EEG.
    """
    return client[MONGO_DATABASE]


def test_connection():
    """
    Vérifie que MongoDB est accessible.
    """
    client = create_client()

    try:
        client.admin.command("ping")
        print("MongoDB service OK")
    finally:
        client.close()