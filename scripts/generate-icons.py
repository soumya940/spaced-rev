#!/usr/bin/env python3
"""Regenerates every Android icon/splash asset from resources/logo-source.png (needs Pillow + numpy).
Usage: python3 scripts/generate-icons.py"""
import os, numpy as np
from PIL import Image, ImageDraw
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=Image.open(os.path.join(ROOT,'resources','logo-source.png')).convert('RGB')
RES=os.path.join(ROOT,'android-overlay','res')
BG=(1,17,45)  # navy sampled from the logo
def out(p,img):
    p=os.path.join(RES,p) if not os.path.isabs(p) else p
    os.makedirs(os.path.dirname(p),exist_ok=True); img.save(p,optimize=True)
a=np.array(SRC).astype(float)
# --- key the gold symbol out of the navy background -> RGBA ---
alpha=np.clip((a[:,:,0]-30)/(110-30),0,1)
bg=np.array(BG,float); al=np.maximum(alpha,1e-3)[:,:,None]
rgb=np.clip((a-bg*(1-al))/al,0,255)
sym=Image.fromarray(np.dstack([rgb,alpha*255]).astype('uint8'),'RGBA')
bbox=sym.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox()
sym=sym.crop(bbox)
dens={'mdpi':1,'hdpi':1.5,'xhdpi':2,'xxhdpi':3,'xxxhdpi':4}
def fg(px,frac=0.54):
    c=Image.new('RGBA',(px,px),(0,0,0,0)); w=int(px*frac); h=int(w*sym.height/sym.width)
    s=sym.resize((w,h),Image.LANCZOS); c.paste(s,((px-w)//2,(px-h)//2),s); return c
def mask_round(img,radius_frac=None):
    n=img.size[0]; m=Image.new('L',(n*4,n*4),0); d=ImageDraw.Draw(m)
    if radius_frac is None: d.ellipse((0,0,n*4-1,n*4-1),fill=255)
    else: d.rounded_rectangle((0,0,n*4-1,n*4-1),radius=int(n*4*radius_frac),fill=255)
    m=m.resize((n,n),Image.LANCZOS); r=img.convert('RGBA'); r.putalpha(m); return r
for d,s in dens.items():
    out(f'mipmap-{d}/ic_launcher_foreground.png',fg(int(108*s)))
    px=int(48*s)
    base=SRC.resize((px,px),Image.LANCZOS)
    out(f'mipmap-{d}/ic_launcher.png',mask_round(base,0.2))
    out(f'mipmap-{d}/ic_launcher_round.png',mask_round(base))
    # notification small icon: white silhouette
    n=int(24*s); sil=Image.new('RGBA',(n,n),(0,0,0,0)); w=int(n*0.92); h=int(w*sym.height/sym.width)
    al_=sym.getchannel('A').point(lambda v:255 if v>90 else 0).resize((w,h),Image.LANCZOS)
    white=Image.new('RGBA',(w,h),(255,255,255,255)); white.putalpha(al_); sil.paste(white,((n-w)//2,(n-h)//2),white)
    out(f'drawable-{d}/ic_stat_icon.png',sil)
# splash logo (transparent symbol on navy window background)
out('drawable-nodpi/splash_logo.png',fg(512,0.62))
# store / web / source assets
res=os.path.join(ROOT,'resources')
SRC.resize((512,512),Image.LANCZOS).save(os.path.join(res,'play-store-icon-512.png'))
fg(1024).save(os.path.join(res,'icon-foreground-1024.png'))
Image.new('RGB',(1024,1024),BG).save(os.path.join(res,'icon-background-1024.png'))
Image.open(os.path.join(res,'logo-source.png')).resize((1024,1024),Image.LANCZOS).save(os.path.join(res,'icon-only-1024.png'))
for n in (192,512): SRC.resize((n,n),Image.LANCZOS).save(os.path.join(ROOT,'www',f'icon-{n}.png'))
print('done')
