import requests
import json

url = "https://content.guardianapis.com/search?api-key=test"
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
