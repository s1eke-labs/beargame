from PIL import Image
from pathlib import Path
import json, shutil
root=Path(__file__).resolve().parents[2]
src=Path('/workspace/shared/beargame-outfits')
archive=root/'source-assets/worker-outfits-v34'
for family in ['forest','craft','civic']:
 shutil.copytree(src/family,archive/family,dirs_exist_ok=True)
rows=[]
forest=[('woodcutter','ready',[100,35,512,490],252,473),('woodcutter','work',[100,528,462,986],252,961),('hunter','ready',[580,40,956,484],769,473),('hunter','work',[580,523,957,971],769,960),('farmer','ready',[1079,31,1465,484],1273,473),('farmer','work',[1079,516,1492,972],1273,961)]
for job,pose,box,x,y in forest: rows.append((archive/'forest/forest-atlas-v1.png',job,pose,box,x,y))
for family,filename in [('craft','craft-atlas-v2.png'),('civic','civic-atlas.png')]:
 for p in json.loads((archive/family/'metadata.json').read_text())['poses']:
  rows.append((archive/family/filename,p['job'],p['pose'],p.get('source_crop_xyxy',p.get('recommended_source_crop_xyxy')),p.get('head_center_x',p.get('body_anchor_head_center_x')),p['feet_baseline_y']))
jobs=['woodcutter','hunter','farmer','scholar','miner','engineer','priest','geologist','ambassador']
rows.sort(key=lambda r:(jobs.index(r[1]),r[2]=='work'))
atlas=Image.new('RGBA',(1536,768));crops={}; scale=.52
for i,(file,job,pose,box,x,y) in enumerate(rows):
 im=Image.open(file).convert('RGBA').crop(box); im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
 dx=round(112-(x-box[0])*scale);dy=round(240-(y-box[1])*scale)
 assert dx>=0 and dy>=0 and dx+im.width<=256 and dy+im.height<=256,(job,pose,dx,dy,im.size)
 cx=i%6*256;cy=i//6*256;atlas.alpha_composite(im,(cx+dx,cy+dy))
 crops[job+pose.title()]={'x':cx,'y':cy,'width':256,'height':256,'job':job,'anchorX':112,'baseline':240}
atlas.save(root/'public/art/worker-outfits.webp',quality=92,method=6)
(root/'src/ui/outfit-art.js').write_text('// Generated occupation frames, aligned by body anchor rather than tool bounds.\nexport const outfitAtlas='+json.dumps({'width':1536,'height':768,'crops':crops},separators=(',',':'))+';\n')
atlas.save('/workspace/shared/beargame-outfits/packed-review.png')
print('Packed',len(crops),'frames;', (root/'public/art/worker-outfits.webp').stat().st_size,'bytes')
