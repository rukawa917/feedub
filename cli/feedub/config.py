from typing import Any

import yaml

from feedub.constants import CONFIG_FILE, FEEDUB_HOME


def load_config() -> dict:
    """Load ~/.feedub/config.yml, return empty dict if not exists."""
    if not CONFIG_FILE.exists():
        return {}
    with open(CONFIG_FILE) as f:
        return yaml.safe_load(f) or {}


def save_config(config: dict) -> None:
    """Save to ~/.feedub/config.yml, create dirs if needed."""
    FEEDUB_HOME.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w") as f:
        yaml.dump(config, f, default_flow_style=False, sort_keys=False)


def get_config_value(key: str) -> Any:
    """Dot-notation access (e.g. 'llm.model')."""
    config = load_config()
    parts = key.split(".")
    current = config
    for part in parts:
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


def set_config_value(key: str, value: Any) -> None:
    """Dot-notation set (e.g. 'llm.model', 'ollama/llama3.2')."""
    config = load_config()
    parts = key.split(".")
    current = config
    for part in parts[:-1]:
        if part not in current or not isinstance(current[part], dict):
            current[part] = {}
        current = current[part]
    current[parts[-1]] = value
    save_config(config)
