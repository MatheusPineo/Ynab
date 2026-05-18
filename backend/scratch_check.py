import requests
try:
    r = requests.get('http://localhost:8002/api/inbox/debug_key/')
    print("STATUS:", r.status_code)
    print("BODY:", r.json())
except Exception as e:
    print("ERROR:", e)
