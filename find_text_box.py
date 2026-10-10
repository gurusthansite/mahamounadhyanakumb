from PIL import Image

def find_text_box():
    img = Image.open('public/assets/poster-frame.png').convert('RGB')
    
    # We scan downwards from y = 800 at x = 150 (center of the photo box)
    x = 150
    in_box = False
    top_y = -1
    bottom_y = -1
    
    for y in range(790, 950):
        r, g, b = img.getpixel((x, y))
        # The text box is a dark green rounded pill.
        # Background is white/light.
        is_dark = (r < 50 and g < 70 and b < 50)
        
        if is_dark and not in_box:
            in_box = True
            top_y = y
        elif not is_dark and in_box:
            bottom_y = y - 1
            break
            
    # Scan horizontally to find the width of the pill
    y_center = top_y + (bottom_y - top_y) // 2
    in_box = False
    left_x = -1
    right_x = -1
    
    for px in range(10, 400):
        r, g, b = img.getpixel((px, y_center))
        is_dark = (r < 50 and g < 70 and b < 50)
        
        if is_dark and not in_box:
            in_box = True
            left_x = px
        elif not is_dark and in_box:
            right_x = px - 1
            break
            
    print(f"Text Box Bounds:")
    print(f"X: {left_x} to {right_x} (Width: {right_x - left_x + 1})")
    print(f"Y: {top_y} to {bottom_y} (Height: {bottom_y - top_y + 1})")
    print(f"Center: ({left_x + (right_x - left_x)//2}, {top_y + (bottom_y - top_y)//2})")

find_text_box()
