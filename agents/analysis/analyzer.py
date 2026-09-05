def analyze_eeg(data):
    """
    Analyse un échantillon EEG et détermine sa priorité.

    Règle actuelle du prototype :
    - amplitude maximale > 80 : CRITIQUE
    - sinon : NORMAL
    """

    channels = data.get("channels", [])

    if not channels:
        return {
            "priority": "NORMAL",
            "max_amplitude": 0
        }

    max_amplitude = max(
        abs(value)
        for value in channels
    )

    priority = (
        "CRITIQUE"
        if max_amplitude > 80
        else "NORMAL"
    )

    return {
        "priority": priority,
        "max_amplitude": round(max_amplitude, 2)
    }