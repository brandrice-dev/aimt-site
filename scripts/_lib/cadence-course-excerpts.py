# Exact non-assessment lesson paragraphs from the existing flat HTML course.
from html.parser import HTMLParser
import sys,json,re
class Reader(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True);self.stack=[];self.rows={str(i):[] for i in range(12)};self.capture=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);mid=self.stack[-1]['mid'] if self.stack else None
  m=re.fullmatch(r'module(\d+)Wrap',a.get('id',''))
  if m:mid=m.group(1)
  elif a.get('id')=='lessonView':mid='3'
  blocked=(self.stack[-1]['blocked'] if self.stack else False) or mid=='12' or any(re.match(r'(cp|checkpoint)',c) for c in a.get('class','').split()) or bool(re.match(r'(?:m\d+)?cp\d',a.get('id','')))
  if tag not in {'br','hr','img','input','meta','link','source','use','wbr','area','embed'}:
   self.stack.append({'tag':tag,'mid':mid,'blocked':blocked})
  if self.capture is None and not blocked and mid in self.rows and ('body-text' in a.get('class','').split() or 'sec-title' in a.get('class','').split()):self.capture=[len(self.stack),mid,[]]
 def handle_data(self,data):
  if self.capture:self.capture[2].append(data)
 def handle_endtag(self,tag):
  if self.capture and self.stack and len(self.stack)==self.capture[0] and self.stack[-1]['tag']==tag:
   text=' '.join(''.join(self.capture[2]).split())
   if text:self.rows[self.capture[1]].append(text)
   self.capture=None
  for i in range(len(self.stack)-1,-1,-1):
   if self.stack[i]['tag']==tag:self.stack=self.stack[:i];break
p=Reader();p.feed(sys.stdin.read());print(json.dumps(p.rows,ensure_ascii=False))
