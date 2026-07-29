import requests
import json

url = "https://wttr.in/Sao_Paulo?format=j1"
try:
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception:
        print(response.text)
except requests.RequestException as e:
    print(f"Request failed: {e}")
