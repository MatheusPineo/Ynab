import requests
try:
    r = requests.get('http://localhost:5173')
    print("FRONTEND STATUS:", r.status_code)
except Exception as e:
    print("FRONTEND ERROR:", e)
