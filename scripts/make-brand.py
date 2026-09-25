from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
# Official Adobe Source Serif 4 variable source, downloaded separately. Not served.
font=TTFont('assets/originals/SourceSerif4Variable-Roman.otf')
def svg_word(text,weight,opsz,tracking=0):
 f=instantiateVariableFont(font,{'wght':weight,'opsz':opsz},inplace=False)
 gs=f.getGlyphSet();cmap=f.getBestCmap();x=0;paths=[];bounds=[]
 for c in text:
  g=gs[cmap[ord(c)]];pen=SVGPathPen(gs);g.draw(pen)
  b=BoundsPen(gs);g.draw(b)
  if b.bounds: bounds.append((x+b.bounds[0],b.bounds[1],x+b.bounds[2],b.bounds[3]))
  paths.append(f'<path transform="translate({x} 0)" d="{pen.getCommands()}"/>')
  x+=g.width+tracking
 xmin=min(b[0] for b in bounds);ymin=min(b[1] for b in bounds);xmax=max(b[2] for b in bounds);ymax=max(b[3] for b in bounds)
 return paths,(xmin,ymin,xmax,ymax)
paths,(x0,y0,x1,y1)=svg_word('LUCAS BANEGA',400,48,120)
Path('public/wordmark.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {-y1} {x1-x0} {y1-y0}" fill="#3E3029"><g transform="scale(1 -1)">{"".join(paths)}</g></svg>')
paths,(x0,y0,x1,y1)=svg_word('B',600,14)
s=320/(y1-y0);tx=(512-(x1-x0)*s)/2-x0*s;ty=(512+(y1-y0)*s)/2+y0*s
Path('assets/favicon-source.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path fill="#F7F4EE" d="M0 0h512v512H0z"/><g fill="#3E3029" transform="translate({tx} {ty}) scale({s} {-s})">{"".join(paths)}</g></svg>')
# Confirm the production font contains both optical-size and weight axes, plus Spanish.
f=TTFont('public/fonts/source-serif-4-latin-variable.woff2')
print('Axes:',[a.axisTag for a in f['fvar'].axes]);assert {'wght','opsz'} <= {a.axisTag for a in f['fvar'].axes}
assert all(ord(c) in f.getBestCmap() for c in 'áéíóúñüÁÉÍÓÚÑÜ¿¡')
