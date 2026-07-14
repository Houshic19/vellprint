import os
import shutil

src_dir = "/home/thanish/.gemini/antigravity/scratch/business-site/logos of dealers"
dest_dir = "/home/thanish/.gemini/antigravity/scratch/business-site/public/dealers"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir, exist_ok=True)

files = sorted([f for f in os.listdir(src_dir) if f.endswith(".jpeg") or f.endswith(".jpg") or f.endswith(".png")])

for idx, file_name in enumerate(files):
    src_file = os.path.join(src_dir, file_name)
    dest_file = os.path.join(dest_dir, f"dealer_{idx+1}.jpg")
    shutil.copy(src_file, dest_file)
    print(f"Copied {file_name} -> dealer_{idx+1}.jpg")
