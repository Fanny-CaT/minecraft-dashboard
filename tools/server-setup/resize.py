from PIL import Image
import sys

img_path = sys.argv[1]
out_path = sys.argv[2]

img = Image.open(img_path)
img = img.resize((64, 64), Image.LANCZOS)
img.save(out_path)
