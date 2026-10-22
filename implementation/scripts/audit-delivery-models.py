"""Audit authored GLBs; disregard color, names, placement, uniform scale and axis rotations.

Fingerprints use rendered triangles in world coordinates, quantized at 1/100000
of the model extent. Mesh attributes, UV splits and material assignments do not
affect them. This detects geometric copies, not semantic or perceptual similarity.
"""
from pathlib import Path
import base64, hashlib, itertools, json, struct, sys
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'assets/deliveries/geometry-cache.json'
VERSION=3

def glb_triangles(path):
    raw=path.read_bytes()
    if raw[:4]!=b'glTF':raise ValueError('Not a GLB: '+str(path))
    length,kind=struct.unpack_from('<II',raw,12)
    doc=json.loads(raw[20:20+length]); offset=20+length; binary=b''
    while offset<len(raw):
        size,chunk=struct.unpack_from('<II',raw,offset)
        if chunk==0x004e4942:binary=raw[offset+8:offset+8+size]
        offset+=8+size
    buffers=[]
    for entry in doc.get('buffers',[]):
        uri=entry.get('uri')
        if uri and not uri.startswith('data:'):raise ValueError('External buffer: '+str(path))
        buffers.append(base64.b64decode(uri.split(',')[1]) if uri else binary)
    for image in doc.get('images',[]):
        if image.get('uri') and not image['uri'].startswith('data:'):raise ValueError('External image: '+str(path))
    dtypes={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
    widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
    def accessor(index):
        a=doc['accessors'][index]; dtype=np.dtype(dtypes[a['componentType']]); width=widths[a['type']]
        if 'sparse' in a:raise ValueError('Sparse accessor requires explicit decoding: '+str(path))
        view=doc['bufferViews'][a['bufferView']]; start=view.get('byteOffset',0)+a.get('byteOffset',0)
        return np.ndarray((a['count'],width),dtype=dtype,buffer=buffers[view['buffer']],offset=start,strides=(view.get('byteStride',dtype.itemsize*width),dtype.itemsize)).copy()
    def local(node):
        if 'matrix' in node:return np.array(node['matrix'],float).reshape(4,4).T
        x,y,z,w=node.get('rotation',[0,0,0,1]); r=np.eye(4)
        r[:3,:3]=[[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]
        r[:3,:3]*=node.get('scale',[1,1,1]);r[:3,3]=node.get('translation',[0,0,0]);return r
    triangles=[]
    def walk(index,parent):
        node=doc['nodes'][index]; world=parent@local(node)
        if 'mesh' in node:
            for primitive in doc['meshes'][node['mesh']]['primitives']:
                if 'POSITION' not in primitive.get('attributes',{}):continue
                p=accessor(primitive['attributes']['POSITION']).astype(float); p=p@world[:3,:3].T+world[:3,3]
                ix=accessor(primitive['indices']).reshape(-1).astype(int) if 'indices' in primitive else np.arange(len(p))
                mode=primitive.get('mode',4)
                if mode==4:faces=ix.reshape(-1,3)
                elif mode==5:faces=np.array([[ix[i],ix[i+1],ix[i+2]] for i in range(len(ix)-2)])
                elif mode==6:faces=np.array([[ix[0],ix[i],ix[i+1]] for i in range(1,len(ix)-1)])
                else:continue
                triangles.append(p[faces])
        for child in node.get('children',[]):walk(child,world)
    children={c for node in doc.get('nodes',[]) for c in node.get('children',[])}
    roots=doc.get('scenes',[{}])[doc.get('scene',0)].get('nodes',[i for i in range(len(doc.get('nodes',[]))) if i not in children])
    for index in roots:walk(index,np.eye(4))
    if not triangles:raise ValueError('No triangle geometry: '+str(path))
    tri=np.concatenate(triangles)
    if not np.isfinite(tri).all():raise ValueError('Nonfinite coordinates: '+str(path))
    return tri

def geometry_fingerprint(path):
    tri=glb_triangles(path); low=tri.min(axis=(0,1));high=tri.max(axis=(0,1));span=(high-low).max()
    if span<=0:raise ValueError('Empty bounds: '+str(path))
    q=np.rint((tri-(low+high)/2)/span*100000).astype('<i4')
    signatures=[]
    # Include reflections as well as rotations: mirroring an object is not a new item.
    for axes in itertools.permutations(range(3)):
        for signs in itertools.product((-1,1),repeat=3):
            t=q[:,:,axes]*np.array(signs,dtype='<i4')
            order=np.lexsort((t[:,:,2],t[:,:,1],t[:,:,0]),axis=1)
            t=np.take_along_axis(t,order[:,:,None],axis=1).reshape(-1,9)
            t=np.unique(t,axis=0)
            signatures.append(hashlib.sha256(t.astype('<i4').tobytes()).hexdigest())
    return min(signatures)

def audit(scan_limit=None):
    CACHE.parent.mkdir(parents=True,exist_ok=True)
    cache=json.loads(CACHE.read_text()) if CACHE.exists() else {}
    if cache.get('version')!=VERSION:cache={'version':VERSION,'files':{}}
    def fingerprint(a):
        path=ROOT/a['file'];raw=path.read_bytes();sha=hashlib.sha256(raw).hexdigest()
        if sha!=a['sha256'] or len(raw)!=a['bytes']:raise ValueError('Hash/size mismatch: '+a['id'])
        if a['license']!='CC0-1.0':raise ValueError('Unapproved license: '+a['id'])
        if sha not in cache['files']:cache['files'][sha]=geometry_fingerprint(path)
        return cache['files'][sha]
    baseline_path=ROOT/'assets/deliveries/baseline.json'
    baseline=json.loads((baseline_path if baseline_path.exists() else ROOT/'assets/catalog.json').read_text())
    existing={}
    for a in baseline:existing.setdefault(fingerprint(a),a['id'])
    groups=[json.loads(p.read_text()) for p in sorted((ROOT/'assets/catalog-parts').glob('expansion_*.json'))]
    candidates=[a for row in itertools.zip_longest(*groups) for a in row if a is not None]
    if scan_limit is not None:candidates=candidates[:scan_limit]
    accepted=[];duplicates=[];errors=[];seen_ids=set()
    for i,a in enumerate(candidates):
        try:
            if a['id'] in seen_ids:raise ValueError('Repeated ID')
            seen_ids.add(a['id']);signature=fingerprint(a)
            if signature in existing:duplicates.append({'id':a['id'],'sameGeometryAs':existing[signature]})
            else:
                existing[signature]=a['id'];a['geometrySignature']=signature;accepted.append(a)
        except Exception as e:errors.append({'id':a['id'],'error':str(e)})
        if i%50==0:
            CACHE.write_text(json.dumps(cache));print('Audited',i+1,'/',len(candidates),'unique new',len(accepted),flush=True)
    CACHE.write_text(json.dumps(cache))
    report={'algorithm':'world triangles; ignores materials, UV splits, position, uniform scale, 48 axis/reflection transforms; quantization 1e-5 extent','baseline':len(baseline),'candidates':len(candidates),'uniqueNew':len(accepted),'duplicates':duplicates,'errors':errors}
    (ROOT/'assets/deliveries/audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    (ROOT/'assets/deliveries/accepted.json').write_text(json.dumps(accepted,ensure_ascii=False,indent=2))
    print(json.dumps({k:v if not isinstance(v,list) else len(v) for k,v in report.items()},ensure_ascii=False))
    return report

if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser();parser.add_argument('--scan-limit',type=int)
    audit(parser.parse_args().scan_limit)
