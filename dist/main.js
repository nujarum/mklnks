import{once as t}from"events";import{rm as e,symlink as r}from"fs/promises";import{cpus as n,tmpdir as o}from"os";import{join as s,resolve as i}from"path";import{fileURLToPath as c}from"url";import{Worker as a}from"worker_threads";import{importMetaResolve as l}from"resolve-esm";import p from"chalk";const{gray:u}=p;const f=l("#worker");const m=process.platform==="win32";const y=b();const h=n().length;const w=Object.freeze(["--experimental-import-meta-resolve"]);const g=c(await f);class k{constructor(t){const e=Object.getOwnPropertyDescriptors(t);Object.values(e).forEach((t=>t.writable=false));Object.defineProperties(this,e)}get[Symbol.toStringTag](){return"LinkInfo"}get isAnyLink(){return 0<this.type}get isDirLink(){return!!(this.type&1)}get isFileLink(){return!!(this.type&2)}get isHardLink(){return!!(this.type&16)}get isJunction(){return!!(this.type&8)}get isSoftLink(){return!!(this.type&12)}get isSymLink(){return!!(this.type&4)}}function d(){return y}async function v(t){const e=process.cwd();t={...t};t.noSymlink&&(t.noSymlink=m);t.quiet||(t.quiet=t.silent);const{baseDir:r=".",dryRun:n,entries:o={},force:s,noSymlink:i,quiet:c,silent:l}=t;const p=[];try{process.chdir(r);const t=L(o);const{size:f}=t;if(f<1){c||console.log(u("No valid entries."));return[]}{const t=p.length=Math.min(h,f);const e=!i&&await y;const r={dryRun:n,force:s,preferSymlink:e,quiet:c,silent:l};const o={execArgv:w,workerData:r};for(let e=0;e<t;p[e++]=new a(g,o));}const m=[...t];const k=new Map(m.map((([t])=>[t,null])));const d=S.bind(null,m.reverse(),k);await Promise.all(p.map(d));return[...k.values()]}finally{p.forEach((t=>void t.terminate()));process.chdir(e)}}async function b(){if(!m){return true}const t={force:true,recursive:true};const n=s(o(),(Date.now()+Math.random()).toString(36).padEnd(12,"0"));try{await e(n,t);await r(n+".tmp",n,"file");return true}catch(t){return false}finally{void e(n,t)}}async function S(e,r,n){while(0<e.length){n.postMessage(e.pop());const[o]=await t(n,"message");r.set(o.linkPath,new k(o))}}function L(t){const e=Object.entries(t);const r=new Map;for(const[t,n]of e){const o=i(t);if(r.has(o)){const n=[...r.keys()].indexOf(o);const[s]=e[n];throw new Error(`Duplicate Links: "${s}" == "${t}"`)}r.set(o,n)}return r}export{d as isSymlinkAvailable,v as mklnks};
//# sourceMappingURL=main.js.map
