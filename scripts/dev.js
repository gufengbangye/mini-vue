import minimist from "minimist";
import esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createRequire } from "module"; //由于mjs下不存在require函数所以使用该方法兼容nodejs的require函数
const args = minimist(process.argv.slice(2));
const target = args._[0] || "reactivity";
const format = args.f || "iife";
console.log(target, format);
const __dirname = dirname(fileURLToPath(import.meta.url));
console.log(__dirname);
const require = createRequire(import.meta.url);
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);
const pkg = require(`../packages/${target}/package.json`);
console.log(pkg);
esbuild.build({
  entryPoints: [entry],
  sourcemap: true,
  format,
  bundle: true,
  platform: "browser",
  globalName: pkg.buildOptions?.name, //用于如果使用iife格式会将打包的文件变成一个函数 函数名为这个
  outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`),
});
