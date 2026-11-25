import os
from PIL import Image

source_path = 'Damn.png'
base_res = 'android/app/src/main/res'

img = Image.open(source_path).convert('RGBA')

configs = [
    ('mipmap-mdpi', 48, 108),
    ('mipmap-hdpi', 72, 162),
    ('mipmap-xhdpi', 96, 216),
    ('mipmap-xxhdpi', 144, 324),
    ('mipmap-xxxhdpi', 192, 432),
]

bg_color = (11, 12, 14, 255) # #0B0C0E

for folder, l_size, fg_size in configs:
    dir_path = os.path.join(base_res, folder)
    os.makedirs(dir_path, exist_ok=True)
    
    # 1. ic_launcher.webp (Full square image)
    launcher_img = img.resize((l_size, l_size), Image.Resampling.LANCZOS)
    launcher_img.save(os.path.join(dir_path, 'ic_launcher.webp'), 'WEBP', quality=100)
    
    # 2. ic_launcher_round.webp (Square centered with 92% scaling on dark background)
    round_canvas = Image.new('RGBA', (l_size, l_size), bg_color)
    round_content_size = int(l_size * 0.90)
    round_scaled = img.resize((round_content_size, round_content_size), Image.Resampling.LANCZOS)
    offset_r = (l_size - round_content_size) // 2
    round_canvas.paste(round_scaled, (offset_r, offset_r), round_scaled)
    round_canvas.save(os.path.join(dir_path, 'ic_launcher_round.webp'), 'WEBP', quality=100)
    
    # 3. ic_launcher_foreground.webp (78% scale centered on dark background to fit 72dp safe zone)
    fg_canvas = Image.new('RGBA', (fg_size, fg_size), bg_color)
    fg_content_size = int(fg_size * 0.78)
    fg_scaled = img.resize((fg_content_size, fg_content_size), Image.Resampling.LANCZOS)
    offset = (fg_size - fg_content_size) // 2
    fg_canvas.paste(fg_scaled, (offset, offset), fg_scaled)
    fg_canvas.save(os.path.join(dir_path, 'ic_launcher_foreground.webp'), 'WEBP', quality=100)
    
    print(f"Generated {folder}: launcher={l_size}x{l_size}, foreground={fg_size}x{fg_size}")

print("All Android launcher icons generated perfectly!")
