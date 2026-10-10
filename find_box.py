from PIL import Image

def find_bounds_better():
    img = Image.open('public/assets/poster-frame.png').convert('RGB')
    
    # scan down at x = 150
    x = 150
    in_box = False
    top_y = -1
    bottom_y = -1
    
    for y in range(450, 850):
        r, g, b = img.getpixel((x, y))
        # The landscape has light blue sky and green grass, and white clouds. 
        # But it's bounded by a white border.
        # Above the box is dark green (approx 20, 40, 20)
        # Below the box is the rounded pill (dark green)
        is_dark = (r < 50 and g < 70 and b < 50)
        
        if not is_dark and not in_box:
            in_box = True
            top_y = y
        elif is_dark and in_box:
            bottom_y = y - 1
            break
            
    # scan right at y = 650
    y = 650
    in_box = False
    left_x = -1
    right_x = -1
    
    for px in range(20, 400):
        r, g, b = img.getpixel((px, y))
        is_dark = (r < 50 and g < 70 and b < 50)
        
        if not is_dark and not in_box:
            in_box = True
            left_x = px
        elif is_dark and in_box:
            right_x = px - 1
            break
            
    print(f"Detected bounds:")
    print(f"X: {left_x} to {right_x} (Width: {right_x - left_x + 1})")
    print(f"Y: {top_y} to {bottom_y} (Height: {bottom_y - top_y + 1})")

find_bounds_better()
