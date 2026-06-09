import urllib.request
import json
import os
import subprocess

server_dir = "/var/lib/pufferpanel/servers/946f16b4"

# 1. Resize Image
try:
    from PIL import Image
    img = Image.open("/home/c7/.gemini/antigravity-cli/brain/13a4e01b-6294-4bac-8766-960098853008/sleepy_white_cat_icon_1780952937877.png")
    img = img.resize((64, 64), Image.Resampling.LANCZOS)
    img.save(os.path.join(server_dir, "server-icon.png"))
    print("Resized and saved server icon!")
except Exception as e:
    print("Error with PIL, falling back to apt:", e)
    subprocess.run(["sudo", "apt-get", "install", "-y", "imagemagick"])
    subprocess.run(["convert", "/home/c7/.gemini/antigravity-cli/brain/13a4e01b-6294-4bac-8766-960098853008/sleepy_white_cat_icon_1780952937877.png", "-resize", "64x64!", os.path.join(server_dir, "server-icon.png")])
    print("Resized using imagemagick.")

# 2. Download VeinMiner (Modrinth API)
def get_modrinth(project):
    try:
        url = f"https://api.modrinth.com/v2/project/{project}/version?game_versions=[%221.21.1%22]&loaders=[%22paper%22]"
        req = urllib.request.Request(url, headers={'User-Agent': 'CustomScript/1.0'})
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if len(data) > 0:
                file_url = data[0]['files'][0]['url']
                filename = data[0]['files'][0]['filename']
                dest = os.path.join(server_dir, "plugins", filename)
                urllib.request.urlretrieve(file_url, dest)
                print(f"Downloaded {filename}")
            else:
                print(f"No Paper 1.21.1 version found for {project}")
    except Exception as e:
        print(f"Failed to fetch {project}:", e)

get_modrinth("veinminer")
get_modrinth("fast-leaf-decay") # QoL Plugin
get_modrinth("gsit") # QoL Plugin

print("Done downloading plugins!")
