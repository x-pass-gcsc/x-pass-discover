"""
Cuts each senior's sprite sheet out of the generated character sheets.

    python3 scripts/build-npc-sprites.py      (needs Pillow and numpy)

  assets-src/office/npcs/<npc key>.png   transparent sheet, three rows:
                                         standing front, right, left, back;
                                         eight walking frames; eight gestures,
                                         the second of which is a wave

Writes public/img/office/npcs/<npc key>.png: one row of five equal frames,
standing down, right, left, up, then the wave, feet on the bottom edge. Every
senior gets the same frame size so the scene loads them all alike; NPC_FRAME_W
and NPC_FRAME_H in office-scene.ts must match the size this prints.

The rows are found from the gaps between them. The standing row always has
gaps between figures; the gesture row often does not, so it is cut at the
emptiest column near each eighth. Only the largest opaque blob in a cell is
kept, which drops sparkles and the edge of a neighbour.
"""
import os
from collections import deque
import numpy as np
from PIL import Image
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
SRC = 'assets-src/office/npcs/'
OUT = 'public/img/office/npcs/'
FH = 128  # front-view height in output px, the same as the player's
WAVE = 1  # index of the wave in the gesture row

def bands(mask, axis, floor, min_len):
    counts = mask.sum(axis)
    runs, start = [], None
    for i, v in enumerate(counts):
        if v > floor and start is None:
            start = i
        elif v <= floor and start is not None:
            runs.append((start, i)); start = None
    if start is not None:
        runs.append((start, len(counts)))
    return [r for r in runs if r[1] - r[0] > min_len]

def largest(cell):
    a = np.array(cell)[:, :, 3] >= 160
    H, W = a.shape
    seen = np.zeros_like(a); best = []
    for y0, x0 in zip(*np.nonzero(a)):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; pts = []
        while q:
            y, x = q.popleft(); pts.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and a[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        if len(pts) > len(best):
            best = pts
    src = np.array(cell); out = np.zeros_like(src)
    ys, xs = zip(*best)
    out[ys, xs] = src[ys, xs]
    out[ys, xs, 3] = 255  # a hard edge: the soft fringe carries the old background
    img = Image.fromarray(out)
    return img.crop(img.getbbox())

def cut_row(im, y0, y1, n, gaps):
    W = im.size[0]
    if gaps:
        mask = np.array(im.crop((0, y0, W, y1)))[:, :, 3] >= 160
        return [im.crop((x0, y0, x1, y1)) for x0, x1 in bands(mask, 0, 2, 20)][:n]
    cols = (np.array(im.crop((0, y0, W, y1)))[:, :, 3] >= 160).sum(0)
    cuts = [0]
    for k in range(1, n):
        guess = k * W // n
        lo, hi = guess - 40, guess + 40
        cuts.append(lo + int(np.argmin(cols[lo:hi])))
    cuts.append(W)
    return [im.crop((cuts[i], y0, cuts[i + 1], y1)) for i in range(n)]

def frames(path):
    im = Image.open(path).convert('RGBA')
    rows = bands(np.array(im)[:, :, 3] >= 160, 1, 3, 40)
    stand = [largest(c) for c in cut_row(im, *rows[0], 4, True)]
    wave = largest(cut_row(im, *rows[2], 8, False)[WAVE])
    # The gesture row is drawn smaller, so the wave is scaled on its own height.
    k, kw = FH / stand[0].size[1], FH / wave.size[1]
    return [f.resize((round(f.size[0] * s), round(f.size[1] * s)), Image.LANCZOS)
            for f, s in [(f, k) for f in stand] + [(wave, kw)]]

os.makedirs(OUT, exist_ok=True)
sheets = {name[:-4]: frames(SRC + name) for name in sorted(os.listdir(SRC)) if name.endswith('.png')}
FW = max(f.size[0] for fs in sheets.values() for f in fs) + 4
FHH = max(f.size[1] for fs in sheets.values() for f in fs) + 4
for key, fs in sheets.items():
    sheet = Image.new('RGBA', (FW * len(fs), FHH), (0, 0, 0, 0))
    for i, f in enumerate(fs):
        sheet.paste(f, (i * FW + (FW - f.size[0]) // 2, FHH - f.size[1] - 2), f)
    sheet.save(OUT + key + '.png', optimize=True)
print('frame', FW, FHH, 'npcs', ', '.join(sheets))
