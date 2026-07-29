import requests
import json
import os
import re

# Map API names to example URLs (public, no-key if possible)
API_MAP = {
    "Currents API": "https://api.currentsapi.services/v1/latest-news?language=en&apiKey=demo",  # demo key may not work
    "GNews": "https://gnews.io/api/v4/top-headlines?token=demo&lang=en",
    "The Guardian Open Platform": "https://content.guardianapis.com/search?api-key=test",
    "OpenWeatherMap": "https://wttr.in/Sao_Paulo?format=j1",  # alternative no-key
    "ExchangeRate-API": "https://api.exchangerate.host/latest?base=USD",
    "IPinfo": "https://ipapi.co/json/",
    "Unsplash API": "https://api.unsplash.com/photos/random?client_id=demo",  # demo key
    "Openverse": "https://api.openverse.engine.org/v1/images/?q=cat&page_size=1",
    "Groq Cloud": "https://api.groq.com/openai/v1/chat/completions",  # needs key
    "Google Gemini API": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=demo",  # needs key
}

def fetch_and_save(api_name, url, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    safe_name = re.sub(r'[^\w\-_]', '_', api_name)
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        # Try to parse JSON
        try:
            data = resp.json()
            ext = '.json'
            content = json.dumps(data, indent=2, ensure_ascii=False)
        except Exception:
            ext = '.txt'
            content = resp.text
        # Save response
        resp_path = os.path.join(output_dir, f"{safe_name}{ext}")
        with open(resp_path, 'w', encoding='utf-8') as f:
            f.write(content)
        # Save a simple Python snippet
        snippet = f'''import requests
import json

url = "{url}"
try:
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except:
        print(response.text)
except Exception as e:
    print(f"Error: {e}")
'''
        snippet_path = os.path.join(output_dir, f"{safe_name}_example.py")
        with open(snippet_path, 'w', encoding='utf-8') as f:
            f.write(snippet)
        print(f"Success: {api_name} -> {resp_path}")
    except Exception as e:
        # Save error info
        error_path = os.path.join(output_dir, f"{safe_name}_error.txt")
        with open(error_path, 'w', encoding='utf-8') as f:
            f.write(f"Failed to fetch {api_name}: {e}")
        print(f"Failed: {api_name} - {e}")

def main():
    # Read planoapi.md
    with open('planoapi.md', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    api_names = []
    for line in lines:
        line = line.strip()
        # Match lines like "10|OpenWeatherMap:" or "11|ExchangeRate-API:"
        match = re.match(r'^\d+\|([^:|]+):?', line)
        if match:
            name = match.group(1).strip()
            if name:
                api_names.append(name)
    
    output_dir = 'api_u'
    for name in api_names:
        url = API_MAP.get(name)
        if url:
            fetch_and_save(name, url, output_dir)
        else:
            print(f"No URL mapping for {name}")

if __name__ == '__main__':
    main()