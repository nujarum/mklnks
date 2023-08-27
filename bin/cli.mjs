#!/usr/bin/env node
import{createRequire as e}from"node:module";import{resolve as n}from"node:path";import o from"chalk";import r from"minimist";import{isSymlinkAvailable as t,mklnks as i}from"#main";const{gray:s,red:a}=o;const c=e(import.meta.url);const{bin:l,version:f}=c("#@");const[u]=Object.keys(l);const d=`\n${u} v${f}\nCreate links as configured.\n\nUSAGE:\n    $ ${u} [FLAGS]\n\nFLAGS:\n    -a, --available         Check if symlinks are available (for Windows).\n\n    -c, --config <FILE>     Run with isolated config file (*.{json|js|cjs|mjs}).\n\n    -d, --dry-run           Run trial execution without actual link creation.\n                            (Override \`Options.dryRun\` to \`true\`.)\n\n    -f, --force             Force to remove existing files/directories in the link path.\n                            (Override \`Options.force\` to \`true\`.)\n\n    -h, --help              Display this message.\n\n    -q, --quiet             NOT to display logs.\n                            (Override \`Options.quiet\` to \`true\`.)\n\n    -s, --silent            NOT to display logs & warnings.\n                            (Override \`Options.silent\` to \`true\`.)\n\n    -v, --version           Display version number.\n\nBy default, load "${u}" field in \`package.json\` as configurations.\n`.trim();const p=Object.freeze({a:"available",c:"config",d:"dry-run",f:"force",h:"help",q:"quiet",s:"silent",v:"version"});const g=r(process.argv.slice(2),{alias:p,boolean:Object.keys(p).filter((e=>e!=="c")),string:["c"]});const m=new Set(Object.entries(p).flat()).add("_").add("--");const h=Object.keys(g).filter((e=>!m.has(e)));await(async()=>{const e={};if(0<h.length){console.error(a("Unknown flags:",h.join()));console.error(s(`Enter \`${u} --help\``));return process.exit(1)}else if(g.h){return console.log(d)}else if(g.v){return console.log(f)}else if(g.a){return console.log("Symlink available:",await t())}else if("c"in g){const n=g.c;if(!n){console.error(a("No config file specified."));console.error(s(`Enter \`${u} --help\``));return process.exit(1)}try{Object.assign(e,await y(n))}catch(e){console.error(a("Failed to load config:",n));return process.exit(1)}}else{try{const o=c(n("package.json"));Object.assign(e,o[u])}catch(e){console.error(a("Failed to load config:","./package.json"));return process.exit(1)}}g.d&&(e.dryRun=true);g.f&&(e.force=true);g.q&&(e.quiet=true);g.s&&(e.silent=true);try{await i(e)}catch(e){console.error(a(e));process.exit(1)}})();async function y(e){e=n(e);if(e.endsWith("js")){const n=await import(e);return n.default}else{return c(e)}}
//# sourceMappingURL=cli.mjs.map