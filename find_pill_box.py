from PIL import Image

def find_pill_width2():
    img = Image.open('public/assets/poster-frame.png').convert('RGB')
    
    y = 824
    
    left = -1
    right = -1
    
    # scan left from 150
    for x in range(150, 0, -1):
        r, g, b = img.getpixel((x, y))
        if r > 240 and g > 240 and b > 240:
            left = x
            break
            
    # scan right from 150
    for x in range(150, 600):
        r, g, b = img.getpixel((x, y))
        if r > 240 and g > 240 and b > 240:
            right = x
            break

    print(f"Left white edge: {left}")
    print(f"Right white edge: {right}")

find_pill_width2()
