"""
Cuts the player's sprite sheet out of the two generated character sheets.

    python3 scripts/build-player-sprite.py      (needs Pillow)

  assets-src/office/player-walk.jpg  2 x 4 grid: front, right, left, back; two
                                     walking frames each
  assets-src/office/player-idle.jpg  1 x 4 row: front, right, left, back, standing

Writes public/img/office/player.png: a 3 x 4 grid of equal frames, one row per
direction (down, right, left, up), columns standing / step A / step B, feet on
the bottom edge. The scene reads it as a spritesheet; FRAME_W and FRAME_H in
office-scene.ts must match the size this prints.

The sources are JPEGs on white, so the white that touches the edge of each
sheet is keyed out (the shirt stays: it is enclosed by the outline), and only
the largest blob in each cell is kept, which drops compression specks.
"""
import os
from collections import deque
from PIL import Image
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
U='assets-src/office/'
OUT='public/img/office/player.png'
def matte(im):
    im=im.convert('RGB'); W,H=im.size; px=im.load()
    bg=[[False]*W for _ in range(H)]
    def white(x,y):
        r,g,b=px[x,y]; return r>228 and g>228 and b>228
    q=deque()
    for x in range(W):
        for y in (0,H-1):
            if white(x,y): bg[y][x]=True; q.append((x,y))
    for y in range(H):
        for x in (0,W-1):
            if white(x,y) and not bg[y][x]: bg[y][x]=True; q.append((x,y))
    while q:
        x,y=q.popleft()
        for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx,ny=x+dx,y+dy
            if 0<=nx<W and 0<=ny<H and not bg[ny][nx] and white(nx,ny):
                bg[ny][nx]=True; q.append((nx,ny))
    out=Image.new('RGBA',(W,H)); op=out.load()
    for y in range(H):
        for x in range(W):
            r,g,b=px[x,y]; op[x,y]=(0,0,0,0) if bg[y][x] else (r,g,b,255)
    return out
def largest(cell):
    W,H=cell.size; a=cell.load(); seen=[[False]*W for _ in range(H)]; best=None
    for y0 in range(H):
        for x0 in range(W):
            if seen[y0][x0] or a[x0,y0][3]==0: continue
            q=deque([(x0,y0)]); seen[y0][x0]=True; pts=[]
            while q:
                x,y=q.popleft(); pts.append((x,y))
                for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx,ny=x+dx,y+dy
                    if 0<=nx<W and 0<=ny<H and not seen[ny][nx] and a[nx,ny][3]:
                        seen[ny][nx]=True; q.append((nx,ny))
            if best is None or len(pts)>len(best): best=pts
    out=Image.new('RGBA',(W,H)); o=out.load()
    for (x,y) in best: o[x,y]=a[x,y]
    return out.crop(out.getbbox())
def cells(im,cols,rows):
    W,H=im.size; res=[]
    for r in range(rows):
        for c in range(cols):
            cell=im.crop((c*W//cols,r*H//rows,(c+1)*W//cols,(r+1)*H//rows))
            res.append(largest(cell))
    return res
walk=cells(matte(Image.open(U+'player-walk.jpg')),2,4)  # front a,b ; right a,b ; left a,b ; back a,b
idle=cells(matte(Image.open(U+'player-idle.jpg')),4,1)  # front, right, left, back
# order per direction: idle, walk a, walk b
order=[('down',idle[0],walk[0],walk[1]),('right',idle[1],walk[2],walk[3]),('left',idle[2],walk[4],walk[5]),('up',idle[3],walk[6],walk[7])]
FH=128  # front-view character height in output px
sw=FH/walk[0].size[1]; si=FH/idle[0].size[1]   # one scale per sheet, matched on the front view
frames=[]
for name,i,wa,wb in order:
    for f,k in ((i,si),(wa,sw),(wb,sw)):
        frames.append(f.resize((max(1,round(f.size[0]*k)),max(1,round(f.size[1]*k))),Image.LANCZOS))
FW=max(f.size[0] for f in frames)+4
FHH=max(f.size[1] for f in frames)+4
sheet=Image.new('RGBA',(FW*3,FHH*4),(0,0,0,0))
for i,f in enumerate(frames):
    r,c=divmod(i,3)
    x=c*FW+(FW-f.size[0])//2; y=r*FHH+FHH-f.size[1]-2
    sheet.paste(f,(x,y),f)
sheet.save(OUT)
print('frame',FW,FHH,'sheet',sheet.size)
