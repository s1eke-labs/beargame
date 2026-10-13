"""Parse rendered fragments for structural regressions; not browser layout validation."""
from html.parser import HTMLParser
import json,sys
class Audit(HTMLParser):
    void={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    def __init__(self):
        super().__init__(convert_charrefs=True);self.stack=[];self.issues=[];self.ids=set();self.buttons=0;self.actions=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='button':
            self.buttons+=1
            if 'button' in self.stack:self.issues.append('Nested button')
            if 'a' in self.stack:self.issues.append('Button nested inside link')
            if 'data-act' in a:self.actions.append({'type':a['data-act'],'id':a.get('data-id')})
        if tag=='a' and 'button' in self.stack:self.issues.append('Link nested inside button')
        if 'id' in a:
            if a['id'] in self.ids:self.issues.append('Duplicate id: '+a['id'])
            self.ids.add(a['id'])
        if tag not in self.void:self.stack.append(tag)
    def handle_endtag(self,tag):
        if tag in self.void:return
        if not self.stack or tag!=self.stack[-1]:self.issues.append('Mismatched closing tag: '+tag)
        if tag in self.stack:
            while self.stack.pop()!=tag:pass
fragments=json.load(sys.stdin);out={}
for key,text in fragments.items():
    p=Audit();p.feed(text);p.close()
    if p.stack:p.issues.append('Unclosed tags: '+','.join(p.stack))
    out[key]={'issues':p.issues,'buttons':p.buttons,'actions':p.actions}
print(json.dumps(out,ensure_ascii=False))
