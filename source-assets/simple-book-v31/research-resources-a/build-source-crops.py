from pathlib import Path
from PIL import Image
from scipy.ndimage import label, find_objects
import numpy as np
import json
root=Path('/workspace/shared/beargame-simple/research-resources-a')
groups={
'research-subjects':{
'seasons':[3,7], 'agriculture':[6], 'hunting':[1], 'mining':[4], 'metallurgy':[2], 'husbandry':[5],
'society':[11], 'mathematics':[12], 'construction':[8], 'hydraulics':[9], 'currency':[10], 'writing':[13],
'philosophy':[18,19,20,23,24,25], 'machinery':[21], 'chemistry':[22], 'astronomy':[16,17], 'navigation':[14], 'electricity':[15],
'biology':[27], 'industry':[26], 'computing':[30], 'nuclear':[29], 'space':[31,32], 'time':[28]},
'semantic-resources-a':{
'manpower':[1,7], 'furs':[5], 'ivory':[2], 'paragon':[3], 'unobtainium':[4], 'titanium':[6],
'oil':[8], 'elderBox':[10], 'wrappingPaper':[12], 'slab':[13], 'plate':[11], 'scaffold':[9],
'concrete':[15], 'alloy':[18], 'eludium':[19], 'ship':[14], 'parchment':[16], 'manuscript':[17],
'compendium':[21], 'blueprint':[23], 'uranium':[24], 'thorium':[25], 'kerosene':[22], 'antimatter':[20]}}
result={}
for atlas,defs in groups.items():
 im=Image.open(root/(atlas+'.png')); a=np.asarray(im)[:,:,3]
 labels,count=label(a>32); regions=find_objects(labels)
 result[atlas]={}
 used=[]
 for key,ids in defs.items():
  used+=ids
  boxes=[regions[i-1] for i in ids]
  x=max(0,min(b[1].start for b in boxes)-6)
  y=max(0,min(b[0].start for b in boxes)-6)
  r=min(im.width,max(b[1].stop for b in boxes)+6)
  b=min(im.height,max(b[0].stop for b in boxes)+6)
  result[atlas][key]={'x':x,'y':y,'width':r-x,'height':b-y}
 assert sorted(used)==list(range(1,count+1)), (atlas,used,count)
 # All source pixels with nontrivial alpha belong to a crop, including separate symbol details.
 covered=np.zeros(a.shape,dtype=bool)
 for c in result[atlas].values(): covered[c['y']:c['y']+c['height'],c['x']:c['x']+c['width']]=True
 assert not np.any((a>32)&(~covered)), atlas
 print(atlas,len(defs),'groups;',count,'components; all alpha > 32 pixels enclosed; six-pixel contour padding')
(root/'source-crops.json').write_text(json.dumps(result,indent=2)+'\n')
