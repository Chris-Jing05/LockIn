#!/bin/bash

# Create a simple colored square as placeholder icon
# This uses macOS built-in tools

# Create base 128x128 image using sf symbols (macOS system icons)
/usr/bin/python3 << 'PYTHON'
# Create simple PNG files programmatically
import struct
import zlib

def create_png(width, height, rgb):
    """Create a simple colored PNG"""
    def png_chunk(chunk_type, data):
        chunk_data = chunk_type + data
        crc = zlib.crc32(chunk_data) & 0xffffffff
        return struct.pack(">I", len(data)) + chunk_data + struct.pack(">I", crc)
    
    # PNG signature
    png_sig = b'\x89PNG\r\n\x1a\n'
    
    # IHDR chunk
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    
    # Create pixel data (RGB)
    raw_data = b''
    for y in range(height):
        raw_data += b'\x00'  # Filter type
        raw_data += bytes(rgb) * width
    
    # IDAT chunk
    idat = zlib.compress(raw_data, 9)
    
    # IEND chunk
    iend = b''
    
    return png_sig + png_chunk(b'IHDR', ihdr) + png_chunk(b'IDAT', idat) + png_chunk(b'IEND', iend)

# Purple color (matching LockIn theme)
purple = [102, 126, 234]

# Create icons
with open('icon128.png', 'wb') as f:
    f.write(create_png(128, 128, purple))

with open('icon48.png', 'wb') as f:
    f.write(create_png(48, 48, purple))

with open('icon16.png', 'wb') as f:
    f.write(create_png(16, 16, purple))

print("Created icon16.png, icon48.png, icon128.png")
PYTHON
