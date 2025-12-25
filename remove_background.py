#!/usr/bin/env python3
"""
Remove gradient background from cherry logo image
"""
try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...")
    import subprocess
    subprocess.check_call(["pip3", "install", "pillow"])
    from PIL import Image

def remove_gradient_background(input_path, output_path):
    """Remove the gradient background (pink to yellow) and make it transparent"""
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        
        # Check if pixel is part of the gradient background
        # The gradient goes from pink/orange to yellow
        # We'll identify background pixels by their color characteristics
        
        # Background pixels are typically:
        # - High saturation, warm colors (pink/orange/yellow range)
        # - Not too dark (to avoid removing the cherries)
        
        # Convert to HSV-like values for easier color detection
        max_val = max(r, g, b)
        min_val = min(r, g, b)
        
        # Check if it's a warm color (pink/orange/yellow gradient)
        is_warm = (r > 200 and g > 150) or (r > 180 and g > 200) or (g > 200 and r > 150)
        
        # Check if it's bright enough to be background (not shadow/dark parts)
        is_bright = max_val > 180
        
        # Check if it's not part of the cherries (cherries have darker borders)
        # Cherries are more saturated and have specific colors
        is_cherry_pink = (r > 200 and g < 150 and b < 150)  # Pink cherry
        is_cherry_orange = (r > 200 and g > 150 and b < 100)  # Orange cherry
        is_cherry_border = max_val < 100  # Dark borders
        is_leaf = (g > 100 and r < 150 and b < 100)  # Green leaf
        is_stem = max_val < 80  # Dark stem
        
        # Keep the pixel if it's part of cherries, leaf, or stem
        if is_cherry_pink or is_cherry_orange or is_cherry_border or is_leaf or is_stem:
            new_data.append(item)
        # Make background transparent if it's warm and bright
        elif is_warm and is_bright:
            new_data.append((r, g, b, 0))  # Transparent
        else:
            new_data.append(item)  # Keep other pixels
    
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Background removed! Saved to {output_path}")

if __name__ == "__main__":
    input_file = "attached_assets/double-cherries-logo.png"
    output_file = "attached_assets/double-cherries-logo.png"  # Overwrite original
    
    remove_gradient_background(input_file, output_file)

