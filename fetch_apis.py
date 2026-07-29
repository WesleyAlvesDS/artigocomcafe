import requests
import json
import os
import re

# API names extracted from planoapi.md
API_RAW = [
    'Currents API',
    'GNews',
    'The Guardian Open Platform',
    'OpenWeatherMap',
    'ExchangeRate-API',
    'IPinfo',
    'Unsplash API',
    'Openverse (antiga CC Search)',
    'Groq Cloud',
    'Google Gemini API',
]

# Filter out non-API entries (the last three are tips)
API_NAMES = [
    'Currents API',
    'GNews',
    'The Guardian Open Platform',
    'OpenWeatherMap',
    'ExchangeRate-API',
    'IPinfo',
    'Unsplash API',
    'Openverse (antiga CC Search)',
    'Groq Cloud',
    'Google Gemini API',
]

# Map to example URLs (using public/demo endpoints where possible)
API_URLS = {
    'Currents API': 'https://api.currentsapi.services/v1/latest-news?language=en&apiKey=demo',
    'GNews': 'https://gnews.io/api/v4/top-headlines?token=demo&lang=en',
    'The Guardian Open Platform': 'https://content.guardianapis.com/search?api-key=test',
    'OpenWeatherMap': 'https://wttr.in/Sao_Paulo?format=j1',  # no key needed
    'ExchangeRate-API': 'https://api.exchangerate.host/latest?base=USD',
    'IPinfo': 'https://ipapi.co/json/',
    'Unsplash API': 'https://api.unsplash.com/photos/random?client_id=demo',
    'Openverse (antiga CC Search)': 'https://api.openverse.engine.org/v1/images/?q=cat&page_size=1',
    'Groq Cloud': 'https://api.groq.com/openai/v1/chat/completions',  # requires key; will fail gracefully
    'Google Gemini API': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=demo',  # requires key
}

def safe_filename(name):
    # Remove problematic characters for filenames
    return re.sub(r'[^\w\-_]', '_', name)

def fetch_and_save(api_name, url, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    safe_name = safe_filename(api_name)
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        # Try to parse as JSON
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
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    try:
        data = response.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except Exception:
        print(response.text)
except requests.RequestException as e:
    print(f"Request failed: {{e}}")
'''
        snippet_path = os.path.join(output_dir, f"{safe_name}_snippet.py")
        with open(snippet_path, 'w', encoding='utf-8') as f:
            f.write(snippet)
        print(f"✓ Saved {api_name} -> {resp_path}")
    except Exception as e:
        print(f"✗ Failed {api_name}: {e}")

def main():
    output_dir = "api_u"
    for name in API_NAMES:
        url = API_URLS.get(name)
        if url:
            fetch_and_save(name, url, output_dir)
        else:
            print(f"⚠ No URL defined for {name}")

if __name__ == "__main__":
    main()