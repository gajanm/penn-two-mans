#!/usr/bin/env python3i just clicked 
"""
Make stem and borders black in cherry logo
"""
try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call(["pip3", "install", "pillow"])
    from PIL import Image

def make_borders_black(input_path, output_path):
    """Make the stem and borders black"""
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        
        # If pixel is transparent, keep it transparent
        if a == 0:
            new_data.append((0, 0, 0, 0))
            continue
        
        # Identify dark pixels (stem and borders)
        # These are typically very dark (low brightness)
        brightness = (r + g + b) / 3
        
        # If it's a dark pixel (likely stem or border), make it black
        if brightness < 100:  # Dark threshold
            new_data.append((0, 0, 0, a))  # Black with original alpha
        else:
            new_data.append(item)  # Keep other pixels as-is
    
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Borders and stem made black! Saved to {output_path}")

if __name__ == "__main__":
    input_file = "attached_assets/generated_images/double-cherries-logo.png"
    output_file = "attached_assets/generated_images/double-cherries-logo.png"
    
    make_borders_black(input_file, output_file)

