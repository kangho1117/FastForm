#!/usr/bin/env python3
"""Generate FastForm icon PNGs using pure Python (no external dependencies)."""
import struct
import zlib
import os

def create_png(width, height, pixels):
    """Create a PNG file from RGBA pixel data."""
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + c + crc

    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'

    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA

    # IDAT - raw pixel data with filter bytes
    raw = b''
    for y in range(height):
        raw += b'\x00'  # No filter
        for x in range(width):
            idx = (y * width + x) * 4
            raw += bytes(pixels[idx:idx+4])

    compressed = zlib.compress(raw)

    return signature + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')


def lerp(a, b, t):
    return int(a + (b - a) * t)


def draw_icon(size):
    """Draw the FastForm icon at the given size."""
    pixels = [0] * (size * size * 4)

    def set_pixel(x, y, r, g, b, a=255):
        if 0 <= x < size and 0 <= y < size:
            idx = (y * size + x) * 4
            # Alpha blending
            if pixels[idx + 3] > 0 and a < 255:
                old_a = pixels[idx + 3] / 255.0
                new_a = a / 255.0
                out_a = new_a + old_a * (1 - new_a)
                if out_a > 0:
                    pixels[idx] = int((r * new_a + pixels[idx] * old_a * (1 - new_a)) / out_a)
                    pixels[idx+1] = int((g * new_a + pixels[idx+1] * old_a * (1 - new_a)) / out_a)
                    pixels[idx+2] = int((b * new_a + pixels[idx+2] * old_a * (1 - new_a)) / out_a)
                    pixels[idx+3] = int(out_a * 255)
            else:
                pixels[idx] = r
                pixels[idx+1] = g
                pixels[idx+2] = b
                pixels[idx+3] = a

    def in_rounded_rect(x, y, w, h, radius):
        if x < radius:
            if y < radius:
                return (x - radius)**2 + (y - radius)**2 <= radius**2
            elif y > h - radius:
                return (x - radius)**2 + (y - (h - radius))**2 <= radius**2
        elif x > w - radius:
            if y < radius:
                return (x - (w - radius))**2 + (y - radius)**2 <= radius**2
            elif y > h - radius:
                return (x - (w - radius))**2 + (y - (h - radius))**2 <= radius**2
        return 0 <= x < w and 0 <= y < h

    radius = int(size * 0.18)

    # Draw rounded rect background with gradient
    for y in range(size):
        for x in range(size):
            if in_rounded_rect(x, y, size, size, radius):
                t = (x + y) / (2 * size)
                r = lerp(99, 139, t)
                g = lerp(102, 92, t)
                b = lerp(241, 246, t)
                set_pixel(x, y, r, g, b)

    # Draw lines (white)
    line_h = max(1, int(size * 0.05))

    def draw_line(x1, y1, x2, y2, thickness, r, g, b):
        for dy in range(-thickness//2, thickness//2 + 1):
            for x in range(int(x1), int(x2)):
                py = int(y1) + dy
                set_pixel(x, py, r, g, b)

    # Form lines
    draw_line(size*0.22, size*0.3, size*0.78, size*0.3, line_h, 255, 255, 255)
    draw_line(size*0.22, size*0.48, size*0.6, size*0.48, line_h, 255, 255, 255)
    draw_line(size*0.22, size*0.66, size*0.68, size*0.66, line_h, 255, 255, 255)

    # Green check circle
    cx, cy = int(size * 0.74), int(size * 0.74)
    cr = int(size * 0.14)

    for y in range(size):
        for x in range(size):
            dx, dy = x - cx, y - cy
            dist = (dx*dx + dy*dy) ** 0.5
            if dist <= cr:
                set_pixel(x, y, 16, 185, 129)
            elif dist <= cr + max(1, size * 0.02):
                set_pixel(x, y, 255, 255, 255)

    # Simple checkmark in circle
    check_w = max(1, int(size * 0.025))
    # Left part of check
    for i in range(int(cr * 0.4)):
        px = cx - int(cr * 0.3) + i
        py = cy - int(cr * 0.05) + i
        for dw in range(-check_w, check_w + 1):
            set_pixel(px, py + dw, 255, 255, 255)

    # Right part of check
    for i in range(int(cr * 0.6)):
        px = cx - int(cr * 0.3) + int(cr * 0.4) + i
        py = cy - int(cr * 0.05) + int(cr * 0.4) - int(i * 1.2)
        for dw in range(-check_w, check_w + 1):
            set_pixel(px, py + dw, 255, 255, 255)

    return pixels


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for s in [16, 48, 128]:
        print(f"Generating {s}x{s} icon...")
        pixels = draw_icon(s)
        png_data = create_png(s, s, pixels)

        path = os.path.join(script_dir, f'icon{s}.png')
        with open(path, 'wb') as f:
            f.write(png_data)
        print(f"  Saved: {path}")

    print("Done!")


if __name__ == '__main__':
    main()
