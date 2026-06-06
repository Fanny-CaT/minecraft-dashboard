import urllib.request, zlib, json

url = "https://bytebin.lucko.me/1epNOibKkM"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    compressed_data = response.read()

try:
    data = zlib.decompress(compressed_data, zlib.MAX_WBITS|32)
    print(data[:500])
except Exception as e:
    print("Error:", e)
