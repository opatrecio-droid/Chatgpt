"""Recover the original GLBs and thumbnails embedded in the portable HTML."""
from pathlib import Path
import argparse,base64,gzip,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('html',type=Path);parser.add_argument('--verify-only',action='store_true');args=parser.parse_args()
source=args.html.read_text();decoder=json.JSONDecoder()
def read_constant(name):
    marker='const '+name+'=';start=source.index(marker)+len(marker)
    return decoder.raw_decode(source,start)[0]
catalog=read_constant('WEB_CATALOG');data=read_constant('WEB_MODEL_DATA');thumbs=read_constant('WEB_THUMBNAILS')
for a in catalog:
    path=(ROOT/a['file']).resolve()
    if not path.is_relative_to(ROOT):raise ValueError('Unsafe model path')
    raw=base64.b64decode(data[a['id']]);raw=gzip.decompress(raw) if raw[:2]==b'\x1f\x8b' else raw
    assert raw[:4]==b'glTF' and hashlib.sha256(raw).hexdigest()==a['sha256'],a['id']
    if not args.verify_only:
        if path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()!=a['sha256']:raise ValueError('Existing file was modified: '+str(path))
        path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(raw)
    if a['id'] in thumbs:
        thumb=ROOT/'assets/thumbnails'/(a['id']+'.jpg')
        assert thumb.resolve().is_relative_to(ROOT)
        if not args.verify_only:
            thumb.parent.mkdir(parents=True,exist_ok=True);thumb.write_bytes(base64.b64decode(thumbs[a['id']].split(',',1)[1]))
print('Verified' if args.verify_only else 'Recovered',len(catalog),'original GLBs; all SHA-256 hashes verified.')
