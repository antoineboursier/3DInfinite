/* Géométrie des profils : arrondi des angles en 2D, puis extrusion avec arête haute / basse arrondie ou chanfreinée. */
function makeGeom(wasm){
  const {Manifold, CrossSection, Mesh} = wasm;
  const CORNER = 25*Math.PI/180;

  function dedupe(c){
    const out=[]; for(const p of c){ const q=out[out.length-1]; if(!q || Math.hypot(p[0]-q[0],p[1]-q[1])>1e-5) out.push(p); }
    while(out.length>1 && Math.hypot(out[0][0]-out[out.length-1][0],out[0][1]-out[out.length-1][1])<=1e-5) out.pop();
    return out;
  }


  const polyArea=c=>{ let a=0; for(let i=0,n=c.length;i<n;i++){ const p=c[i], q=c[(i+1)%n]; a+=p[0]*q[1]-q[0]*p[1]; } return a/2; };
  /* Nettoyage 2D avant extrusion : points trop proches, simplification (Douglas-Peucker), débris et trous minuscules, filaments.
     Les seuils sont en mm ; opts.open > 0 ajoute une ouverture morphologique (supprime ce qui est plus fin que 2 x open). */
  function cleanPolys(polys, o){
    o=o||{}; const minDist=o.minDist||0, eps=o.eps||0, minArea=o.minArea||0, open=o.open||0;
    let ps=polys.map(c=>{ if(!minDist) return c; const out=[]; for(const p of c){ const q=out[out.length-1]; if(!q||Math.hypot(p[0]-q[0],p[1]-q[1])>=minDist) out.push(p); }
      while(out.length>1&&Math.hypot(out[0][0]-out[out.length-1][0],out[0][1]-out[out.length-1][1])<minDist) out.pop(); return out; }).filter(c=>c.length>2);
    if(!ps.length) return [];
    let cs=new CrossSection(ps,"EvenOdd");
    const step=n=>{ cs.delete(); cs=n; };
    if(open>0){ const e=cs.offset(-open,"Miter",2); step(e.offset(open,"Miter",2)); e.delete(); }
    if(eps>0) step(cs.simplify(eps));
    ps=cs.toPolygons().map(dedupe).filter(c=>c.length>2&&Math.abs(polyArea(c))>=minArea);
    cs.delete(); return ps;
  }

  /* Arrondit les angles vifs d'un contour fermé, façon « rayon d'angle » : les courbes (suites de petits segments) ne sont pas touchées,
     et le rayon se réduit tout seul quand le côté est trop court. */
  function roundContour(c, r){
    const n=c.length; if(n<3 || r<=0) return c;
    const cum=new Float64Array(n+1), turn=new Float64Array(n);
    for(let i=0;i<n;i++){ const a=c[i], b=c[(i+1)%n]; cum[i+1]=cum[i]+Math.hypot(b[0]-a[0],b[1]-a[1]); }
    const L=cum[n], corners=[];
    for(let i=0;i<n;i++){
      const p=c[(i+n-1)%n], q=c[i], s=c[(i+1)%n];
      const ax=q[0]-p[0], ay=q[1]-p[1], bx=s[0]-q[0], by=s[1]-q[1];
      turn[i]=Math.abs(Math.atan2(ax*by-ay*bx, ax*bx+ay*by));
      if(turn[i]>CORNER) corners.push(i);
    }
    if(!corners.length) return c;
    const m=corners.length, t=new Float64Array(m);
    for(let k=0;k<m;k++){
      const i=corners[k], prev=corners[(k+m-1)%m], next=corners[(k+1)%m];
      let lb=cum[i]-cum[prev]; if(lb<=0) lb+=L;
      let lf=cum[next]-cum[i]; if(lf<=0) lf+=L;
      const want=turn[i]>3.1 ? Infinity : r*Math.tan(turn[i]/2);
      t[k]=Math.min(want, lb/2, lf/2); if(t[k]<1e-4) t[k]=0;
    }
    const at=s=>{ s=((s%L)+L)%L; let lo=0, hi=n-1; while(lo<hi){ const mid=(lo+hi+1)>>1; if(cum[mid]<=s) lo=mid; else hi=mid-1; }
      const a=c[lo], b=c[(lo+1)%n], len=cum[lo+1]-cum[lo]||1, u=(s-cum[lo])/len;
      return {p:[a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u], d:[(b[0]-a[0])/len,(b[1]-a[1])/len]}; };
    const out=[];
    for(let k=0;k<m;k++){
      const i=corners[k], nk=(k+1)%m, j=corners[nk];
      /* le coin i */
      if(t[k]===0) out.push(c[i]);
      else{
        const A=at(cum[i]-t[k]-1e-9), B=at(cum[i]+t[k]+1e-9);
        const phi=Math.abs(Math.atan2(A.d[0]*B.d[1]-A.d[1]*B.d[0], A.d[0]*B.d[0]+A.d[1]*B.d[1]));
        const chord=Math.hypot(B.p[0]-A.p[0],B.p[1]-A.p[1]);
        out.push(A.p);
        if(phi>1e-3 && chord>1e-6){
          const R=chord/(2*Math.sin(phi/2)), h=4/3*Math.tan(phi/4)*R, N=Math.max(4,Math.ceil(phi/(9*Math.PI/180)));
          const c1=[A.p[0]+A.d[0]*h,A.p[1]+A.d[1]*h], c2=[B.p[0]-B.d[0]*h,B.p[1]-B.d[1]*h];
          for(let s=1;s<N;s++){ const u=s/N, v=1-u, w0=v*v*v, w1=3*v*v*u, w2=3*v*u*u, w3=u*u*u;
            out.push([w0*A.p[0]+w1*c1[0]+w2*c2[0]+w3*B.p[0], w0*A.p[1]+w1*c1[1]+w2*c2[1]+w3*B.p[1]]); }
        }
        out.push(B.p);
      }
      /* les sommets conservés entre ce coin et le suivant */
      let a=cum[i]+t[k], b=cum[j]-t[nk]; if(b<=a-1e-9 || (m===1)) b+=L;
      for(let q=1;q<n;q++){ const v=(i+q)%n; if(v===j) break; let s=cum[v]; if(s<a) s+=L; if(s>a+1e-7 && s<b-1e-7) out.push(c[v]); }
    }
    return dedupe(out);
  }

  /* contours sources -> section propre (angles arrondis, contour évidé éventuel) */
  function buildSection(src, fill, r, outline){
    let cs=new CrossSection(src, fill||'NonZero');
    { const ps=cleanPolys(cs.toPolygons(),{minDist:.005,eps:.001,minArea:.02}); if(ps.length){ cs.delete(); cs=new CrossSection(ps,'EvenOdd'); } }
    if(r>0){ const polys=cs.toPolygons().map(dedupe).filter(c=>c.length>2).map(c=>roundContour(c,r)); cs.delete(); cs=new CrossSection(polys,'EvenOdd'); }
    if(outline>0){ const inner=cs.offset(-outline,'Miter',4); const ring=cs.subtract(inner); inner.delete(); if(!ring.isEmpty()){ cs.delete(); cs=ring; } else ring.delete(); }
    return cs;
  }

  function insetNormals(c){
    const n=c.length, out=new Array(n);
    for(let i=0;i<n;i++){
      const p=c[(i+n-1)%n], q=c[i], s=c[(i+1)%n];
      let ax=q[0]-p[0], ay=q[1]-p[1], bx=s[0]-q[0], by=s[1]-q[1];
      const la=Math.hypot(ax,ay)||1, lb=Math.hypot(bx,by)||1; ax/=la; ay/=la; bx/=lb; by/=lb;
      /* la matière est à gauche du sens de parcours */
      let nx=-(ay+by), ny=ax+bx; const ln=Math.hypot(nx,ny);
      if(ln<1e-6){ out[i]=[-ay,ax]; continue; }
      nx/=ln; ny/=ln; const cosH=Math.max(.25, nx*-ay+ny*ax);
      out[i]=[nx/cosH, ny/cosH];
    }
    return out;
  }
  function insetInfo(c){
    const n=c.length, info=insetNormals(c).map(nn=>({n:nn,rho:Infinity}));
    const turn=new Float64Array(n), ex=new Float64Array(n), ey=new Float64Array(n), el=new Float64Array(n);
    for(let i=0;i<n;i++){ const q=c[i], s=c[(i+1)%n]; ex[i]=s[0]-q[0]; ey[i]=s[1]-q[1]; el[i]=Math.hypot(ex[i],ey[i])||1e-12; }
    for(let i=0;i<n;i++){ const a=(i+n-1)%n; turn[i]=Math.atan2(ex[a]*ey[i]-ey[a]*ex[i], ex[a]*ex[i]+ey[a]*ey[i]); }
    const isArc=i=>turn[i]>0.005 && turn[i]<=CORNER;
    /* un arc de coin = suite de petits segments entre deux grands côtés droits */
    const lng=i=>el[i]>3*Math.max(el[(i+n-1)%n],el[(i+1)%n]);
    let st=-1; for(let i=0;i<n;i++) if(lng((i+n-1)%n)){ st=i; break; }
    if(st<0) return info;
    for(let q=0;q<n;){
      const v0=(st+q)%n;
      if(!isArc(v0)){ q++; continue; }
      const run=[v0]; q++;
      while(q<n){ const u=(st+q)%n; if(lng((u+n-1)%n)||!isArc(u)) break; run.push(u); q++; }
      let T=0, arc=0; for(let k=0;k<run.length;k++){ T+=turn[run[k]]; if(k<run.length-1) arc+=el[run[k]]; }
      if(T<0.1 || T>Math.PI-0.15) continue;
      const f=run[0], l=run[run.length-1], ef=(f+n-1)%n;
      let dx=-ey[ef]/el[ef]-ey[l]/el[l], dy=ex[ef]/el[ef]+ex[l]/el[l]; const dl=Math.hypot(dx,dy)||1; dx/=dl; dy/=dl;
      const rho=arc/T, k=1/Math.cos(T/2);
      for(const v of run){ info[v].rho=rho; info[v].dir=[dx,dy]; info[v].k=k; }
    }
    return info;
  }
  const insetAt=(f,d)=> d<=f.rho ? [f.n[0]*d, f.n[1]*d] : [f.n[0]*f.rho+f.dir[0]*(d-f.rho)*f.k, f.n[1]*f.rho+f.dir[1]*(d-f.rho)*f.k];
  const area=c=>{ let a=0; for(let i=0,n=c.length;i<n;i++){ const p=c[i], q=c[(i+1)%n]; a+=p[0]*q[1]-q[0]*p[1]; } return a/2; };

  function ringsFor(H, rt, rb, style){
    const N=style==='chamfer'?1:12, rings=[];
    if(rb>0) for(let k=0;k<=N;k++){ const a=k/N*Math.PI/2; rings.push(style==='chamfer' ? [rb*(1-k), rb*k] : [rb*(1-Math.sin(a)), rb*(1-Math.cos(a))]); }
    else rings.push([0,0]);
    const z0=H-rt; if(z0-rings[rings.length-1][1]>1e-6) rings.push([0,z0]);
    if(rt>0){ for(let k=(rings[rings.length-1][1]>=z0-1e-6?1:0);k<=N;k++){ const a=k/N*Math.PI/2; rings.push(style==='chamfer' ? [rt*k, z0+rt*k] : [rt*(1-Math.cos(a)), z0+rt*Math.sin(a)]); } }
    else if(H-rings[rings.length-1][1]>1e-6) rings.push([0,H]);
    return rings;
  }

  /* peau continue : chaque anneau reprend les mêmes sommets, décalés vers l'intérieur */
  function loft(polys, rings){
    const norms=polys.map(insetInfo), starts=[]; let per=0;
    for(const c of polys){ starts.push(per); per+=c.length; }
    const verts=new Float32Array(rings.length*per*3), tris=[];
    rings.forEach(([d,z],ri)=>polys.forEach((c,ci)=>c.forEach((p,i)=>{ const o=(ri*per+starts[ci]+i)*3, nn=norms[ci][i]; const t=insetAt(nn,d); verts[o]=p[0]+t[0]; verts[o+1]=p[1]+t[1]; verts[o+2]=z; })));
    for(let ri=0;ri<rings.length-1;ri++) polys.forEach((c,ci)=>{ const n=c.length, b0=ri*per+starts[ci], b1=b0+per;
      for(let i=0;i<n;i++){ const j=(i+1)%n; tris.push(b0+i,b0+j,b1+j, b0+i,b1+j,b1+i); } });
    const capPolys=ri=>polys.map((c,ci)=>c.map((p,i)=>{ const o=(ri*per+starts[ci]+i)*3; return [verts[o],verts[o+1]]; }));
    const top=rings.length-1;
    for(const tr of wasm.triangulate(capPolys(0))) tris.push(tr[0],tr[2],tr[1]);
    for(const tr of wasm.triangulate(capPolys(top))) tris.push(top*per+tr[0],top*per+tr[1],top*per+tr[2]);
    return {verts, tris:new Uint32Array(tris), capPolys};
  }

  /* repli robuste quand la pièce est trop fine pour le rayon : empilement de tranches décalées */
  function stairs(cs, H, rt, rb, style){
    const parts=[], N=style==='chamfer'?10:16;
    const slab=(d,z0,z1)=>{ const s=d>1e-6?cs.offset(-d,'Miter',4):cs; if(!s.isEmpty()&&z1-z0>1e-6) parts.push(Manifold.extrude(s,z1-z0).translate([0,0,z0])); if(s!==cs) s.delete(); };
    const prof=(R,u)=> style==='chamfer' ? R*(1-u) : R*(1-Math.sqrt(Math.max(0,1-(1-u)*(1-u))));
    for(let k=0;k<N&&rb>0;k++) slab(prof(rb,(k+.5)/N), rb*k/N, rb*(k+1)/N);
    slab(0, rb, H-rt);
    for(let k=0;k<N&&rt>0;k++) slab(prof(rt,(k+.5)/N), H-rt*(k+1)/N, H-rt*k/N);
    if(!parts.length) return Manifold.extrude(cs,H);
    const u=parts.length>1?Manifold.union(parts):parts[0]; if(parts.length>1) parts.forEach(p=>p.delete());
    return u;
  }

  /* p = {src, fill, sx, sy, h, r, rt, rb, style, outline} -> Manifold posé sur z=0 ; null si le profil est vide */
  function profileSolid(p){
    const sx=(p.sx||1)*(p.mx?-1:1), sy=(p.sy||1)*(p.my?-1:1);
    const src=p.src.map(c=>c.map(q=>[q[0]*sx,q[1]*sy]));
    const cs=buildSection(src, p.fill, p.r||0, p.outline||0);
    if(cs.isEmpty()){ cs.delete(); return null; }
    const H=Math.max(.05,p.h); let rt=Math.max(0,p.rt||0), rb=Math.max(0,p.rb||0);
    if(rt+rb>H){ const k=H/(rt+rb); rt*=k; rb*=k; }
    if(p.outline>0){ const w=p.outline*.49; rt=Math.min(rt,w); rb=Math.min(rb,w); }
    let man=null;
    if(rt<1e-6 && rb<1e-6) man=Manifold.extrude(cs,H);
    else{
      /* arrondi lisse : à 100 % le rayon atteint la demi-section et la peau par décalage n'est plus valable.
         Plutôt que de tomber sur les marches, on réduit le rayon de quelques pourcents jusqu'à une peau valable. */
      const tryLoft=(a,b)=>{
        try{
          const polys=cs.toPolygons().map(dedupe).filter(c=>c.length>2), rings=ringsFor(H,a,b,p.style);
          const L=loft(polys,rings), R=Math.max(a,b), ref=cs.offset(-R,'Miter',4), aRef=ref.area(); ref.delete();
          const ri=b>=a?0:rings.length-1, aLoft=L.capPolys(ri).reduce((s,c)=>s+area(c),0);
          const each=L.capPolys(ri).every((c,ci)=>Math.sign(area(c))===Math.sign(area(polys[ci])));
          if(each && aRef>1e-9 && Math.abs(aLoft-aRef)<=aRef*.004){
            const m=new Manifold(new Mesh({numProp:3,vertProperties:L.verts,triVerts:L.tris}));
            if(m.isEmpty()||m.volume()<=0){ m.delete(); return null; }
            return m;
          }
        }catch(e){}
        return null;
      };
      for(const k of [1,.995,.99,.98,.97,.95,.9]){ man=tryLoft(rt*k,rb*k); if(man) break; }
      if(!man) man=stairs(cs,H,rt,rb,p.style);
    }
    /* coque : on creuse l'intérieur en gardant un fond de la même épaisseur */
    if(p.shell>0 && H>p.shell+.05){
      const inner=cs.offset(-p.shell,'Miter',4);
      if(!inner.isEmpty()){ const cut=Manifold.extrude(inner,H).translate([0,0,p.shell]), res=man.subtract(cut); cut.delete(); man.delete(); man=res; }
      inner.delete();
    }
    cs.delete();
    return man;
  }
  return {roundContour, buildSection, profileSolid, dedupe, cleanPolys};
}
