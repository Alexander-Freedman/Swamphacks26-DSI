# Rebuilds the inline QR SVGs in docs/expo/table-card.html (no app dependency).
# Run from the repo root: uv run --with qrcode python docs/expo/make-qr.py [url]
# Replaces everything between <!--QR--> and <!--/QR--> markers in the card.
import pathlib
import re
import sys

import qrcode

URL = sys.argv[1] if len(sys.argv) > 1 else "https://alexander-freedman.github.io/Swamphacks26-DSI/?session=birthday"
CARD = pathlib.Path(__file__).with_name("table-card.html")

q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
q.add_data(URL)
q.make(fit=True)
m = q.get_matrix()
n = len(m)
d = "".join(f"M{x},{y}h1v1h-1z" for y, row in enumerate(m) for x, on in enumerate(row) if on)
svg = (
    f'<svg class="qr" viewBox="-4 -4 {n + 8} {n + 8}" xmlns="http://www.w3.org/2000/svg" role="img" '
    f'aria-label="QR code: {URL}" shape-rendering="crispEdges">'
    f'<rect x="-4" y="-4" width="{n + 8}" height="{n + 8}" fill="#fff"/><path fill="#1b2340" d="{d}"/></svg>'
)
html = CARD.read_text()
html, count = re.subn(r"<!--QR-->.*?<!--/QR-->", lambda _: f"<!--QR-->{svg}<!--/QR-->", html, flags=re.S)
CARD.write_text(html)
print(f"{count} QR block(s) updated -> {URL}")
