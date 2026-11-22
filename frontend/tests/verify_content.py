"""Read-only comparison with the untouched Streamlit sources. No Streamlit import."""
import ast
import hashlib
import html
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / 'frontend/src/content'

def literal(file, name):
    tree = ast.parse((ROOT / file).read_text())
    return next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == name for t in n.targets))

for source, name, dest in [('quiz.py', 'QUESTIONS', 'initialQuiz.json'), ('nikita_story.py', 'NIKITA_STORY', 'nikita.json')]:
    assert literal(source, name) == json.loads((CONTENT / dest).read_text()), f'Content mismatch: {source}'
    print(f'PASS exact content: {source} (all fields, order, paragraphs, keys and explanations)')

stats = json.loads((CONTENT / 'statistics.json').read_text())
assert stats['sources'] == literal('invisible_statistics.py', 'SOURCES')
tree = ast.parse((ROOT / 'invisible_statistics.py').read_text())
clean = lambda s: html.unescape(re.sub('<[^>]+>', '', s))
for fn, key in [('_screen_russia','russia'),('_screen_world','world'),('_screen_limits','limits'),('_screen_connection','connection')]:
    f = next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name == fn)
    expected = []
    for n in ast.walk(f):
        if isinstance(n,ast.Call) and n.args and isinstance(n.args[0],ast.Constant) and isinstance(n.args[0].value,str):
            name = n.func.attr if isinstance(n.func,ast.Attribute) else n.func.id if isinstance(n.func,ast.Name) else ''
            if name in ('_tag','title','write','caption','markdown','success'):
                expected.append((n.lineno,{'kind':name,'text':clean(n.args[0].value)}))
        if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and n.func.attr=='radio' and key=='limits':
            assert stats['limitOptions'] == ast.literal_eval(n.args[1])
    assert stats[key] == [item for _,item in sorted(expected)]
for n in ast.walk(tree):
    if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id in ('values','data'):
        value=eval(compile(ast.Expression(n.value),'statistics','eval'),{'SOURCES':stats['sources'],'__builtins__':{}})
        assert stats[n.targets[0].id] == json.loads(json.dumps(value))
    if isinstance(n,ast.For) and isinstance(n.target,ast.Tuple) and [x.id for x in n.target.elts if isinstance(x,ast.Name)]==['label','text']:
        assert stats['connections'] == json.loads(json.dumps(ast.literal_eval(n.iter)))
print('PASS exact statistics: 4 screens, values, datasets, limitations, sources and options')
for image in (ROOT / 'assets/nikita').glob('*.jpg'):
    assert image.read_bytes() == (ROOT / 'frontend/public/assets/nikita' / image.name).read_bytes()
print('PASS all 5 image copies are byte-identical')

# Preserve the user-supplied DOCX and verify the extraction fixture used by Liza tests.
from zipfile import ZipFile
from xml.etree import ElementTree as ET
source = ROOT / 'frontend/docs/sources/liza-scenario-2.0.docx'
fixture = json.loads((ROOT / 'frontend/tests/fixtures/liza-v2-source.json').read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest() == fixture['sha256']
with ZipFile(source) as archive:
    document = ET.fromstring(archive.read('word/document.xml'))
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
paragraphs = [''.join(node.text or '' for node in p.findall('.//w:t', ns)) for p in document.findall('./w:body/w:p', ns)]
assert paragraphs == fixture['paragraphs']
print('PASS original Liza DOCX and exact source-paragraph extraction (scenario 2.0)')
