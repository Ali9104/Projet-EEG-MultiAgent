def get_storage_policy(priority):
    if priority == "CRITIQUE":
        return ["redis", "mongodb", "minio"]

    return ["mongodb", "minio"]