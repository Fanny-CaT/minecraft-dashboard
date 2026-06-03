import asyncio
import websockets
import urllib.request
import json
import ssl

async def test_auth_header(token):
    print("Testing with Authorization header...")
    url = "wss://meowtopia-panel.duckdns.org/proxy/daemon/server/946f16b4/console"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        async with websockets.connect(url, extra_headers=headers) as ws:
            print("Successfully connected with Authorization header!")
            # Read one message
            msg = await ws.recv()
            print("Received:", msg)
            return True
    except Exception as e:
        print("Failed with Authorization header:", e)
        return False

async def test_subprotocol(token):
    print("\nTesting with subprotocol ['bearer', token]...")
    url = "wss://meowtopia-panel.duckdns.org/proxy/daemon/server/946f16b4/console"
    try:
        async with websockets.connect(url, subprotocols=["bearer", token]) as ws:
            print("Successfully connected with subprotocols!")
            msg = await ws.recv()
            print("Received:", msg)
            return True
    except Exception as e:
        print("Failed with subprotocols:", e)
        return False

async def test_query_param(token, param_name):
    print(f"\nTesting with query param ?{param_name}=...")
    url = f"wss://meowtopia-panel.duckdns.org/proxy/daemon/server/946f16b4/console?{param_name}={token}"
    try:
        async with websockets.connect(url) as ws:
            print(f"Successfully connected with ?{param_name}!")
            msg = await ws.recv()
            print("Received:", msg)
            return True
    except Exception as e:
        print(f"Failed with ?{param_name}:", e)
        return False

def get_token():
    url = "https://meowtopia-panel.duckdns.org/oauth2/token"
    data = "grant_type=client_credentials&client_id=028831fc-688b-4811-a1f8-ce7008958cb6&client_secret=nel4nBv8VvSnTog0od8Oy-43045LSEn-jO56MRA9g7ngJwq3"
    req = urllib.request.Request(
        url, 
        data=data.encode('utf-8'), 
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        return res["access_token"]

async def main():
    token = get_token()
    print("Token fetched successfully.")
    
    # Try all methods
    await test_auth_header(token)
    await test_subprotocol(token)
    await test_query_param(token, "token")
    await test_query_param(token, "access_token")

if __name__ == "__main__":
    asyncio.run(main())
