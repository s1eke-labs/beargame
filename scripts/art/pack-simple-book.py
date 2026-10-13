"""Crop generated atlas cells without changing their pixels/art style; pack padded runtime assets.
Input grid and semantic order are recorded in each job manifest. Alpha is preserved.
"""
import json,sys
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[2]
def run(job):
 im=Image.open(job['source']).convert('RGBA');cols=job['columns'];rows=job['rows'];keys=job['keys'];cell=job.get('cell',256);outcols=job.get('outputColumns',cols);pad=job.get('padding',16)
 dst=Image.new('RGBA',(outcols*cell,((len(keys)+outcols-1)//outcols)*cell))
 mapping={};report=[]
 for i,key in enumerate(keys):
  cx,cy=i%cols,i//cols
  box=(round(cx*im.width/cols),round(cy*im.height/rows),round((cx+1)*im.width/cols),round((cy+1)*im.height/rows))
  if job.get('sourceCrops'):
   c=job['sourceCrops'][key];c=c.get('crop',c);box=(c['x'],c['y'],c['x']+c['width'],c['y']+c['height'])
  tile=im.crop(box);bbox=tile.getchannel('A').point(lambda v:255 if v>12 else 0).getbbox()
  if not bbox:raise ValueError('Empty sprite '+key)
  tile=tile.crop(bbox);tile.thumbnail((cell-pad*2,cell-pad*2),Image.Resampling.LANCZOS)
  x=(i%outcols)*cell+(cell-tile.width)//2;y=(i//outcols)*cell+(cell-tile.height)//2
  dst.alpha_composite(tile,(x,y));mapping[key]={'sheet':job['sheet'],'width':dst.width,'height':dst.height,'crop':{'x':x,'y':y,'width':tile.width,'height':tile.height}}
  report.append({'key':key,'sourceCell':box,'alphaBounds':bbox,'crop':mapping[key]['crop']})
 dest=root/'public/art'/job['output'];dst.save(dest,'WEBP',quality=94,method=6)
 (root/'source-assets/simple-book-v31'/f"{job['sheet']}-crops.json").write_text(json.dumps({'job':job,'crops':report},indent=2))
 if job.get('registry'):
  file=root/job['registry'];name=job['export'];existing={}
  if job.get('merge') and file.exists():existing=json.loads(file.read_text().split('=',1)[1].strip().rstrip(';'))
  existing.update(mapping)
  for alias,target in job.get('aliases',{}).items():existing[alias]=mapping[target]
  file.write_text('export const '+name+'='+json.dumps(existing,separators=(',',':'))+';\n')
 print(json.dumps({'file':str(dest),'size':dest.stat().st_size,'sprites':len(keys),'mapping':mapping}))
if __name__=='__main__':
 for job in json.loads(Path(sys.argv[1]).read_text()):run(job)
