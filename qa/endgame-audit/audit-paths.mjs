/** Portable audit location: run from the checkout or supply --checkout /path. */
import path from 'node:path';import {pathToFileURL,fileURLToPath}from'node:url';
const option=name=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:process.argv.find(v=>v.startsWith(name+'='))?.slice(name.length+1);};
export const checkout=path.resolve(option('--checkout')||process.env.BEARGAME_CHECKOUT||process.cwd());
export const outputDirectory=path.resolve(option('--output-dir')||process.env.BEARGAME_AUDIT_OUTPUT||path.dirname(fileURLToPath(import.meta.url)));
export const auditFile=name=>path.join(outputDirectory,name);
export const importModule=relative=>import(pathToFileURL(path.join(checkout,relative)).href);
