"""Convert a raw cpio stream to the legacy LZ4 framing Linux initramfs supports."""
import ctypes
import struct
import sys

lz4 = ctypes.CDLL("liblz4.so.1")
lz4.LZ4_compressBound.argtypes = [ctypes.c_int]
lz4.LZ4_compress_HC.argtypes = [ctypes.c_char_p, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int]
block_size = 8 * 1024 * 1024
buffer = ctypes.create_string_buffer(lz4.LZ4_compressBound(block_size))
out = sys.stdout.buffer
out.write(struct.pack("<I", 0x184C2102))
for block in iter(lambda: sys.stdin.buffer.read(block_size), b""):
    size = lz4.LZ4_compress_HC(block, buffer, len(block), len(buffer), 9)
    if not size:
        raise RuntimeError("LZ4 compression failed")
    out.write(struct.pack("<I", size))
    out.write(buffer.raw[:size])
