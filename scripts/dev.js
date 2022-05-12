const args = require("minimist")(process.argv.slice(2));
//打包参数
const target = args._[0] || "reactivity";
const format = args.f || "global";
const { resolve } = require("path");
const { build } = require("esbuild");
const { Console } = require("console");
//
const buildRoot = `../packages/${target}`;
//打包模块的配置文件
const pkg = require(resolve(__dirname, `${buildRoot}/package.json`));
//输出格式
//iife 立即执行 (function(){})()
//cjs moudle.export
//esm import
const outFormat = format.startsWith("global") ? "iife" : format === "cjs" ? "cjs" : "esm";
//输出文件
const outfile = resolve(__dirname, `${buildRoot}/dist/${target}.${format}.js`);
console.log(pkg.buildOptions?.name);
//esbuild打包
build({
  entryPoints: [resolve(__dirname, `${buildRoot}/src/index.ts`)],
  outfile,
  bundle: true, //打包到一起
  sourcemap: true,
  format: outFormat, //输出格式
  globalName: pkg.buildOptions?.name, //全局模块变量名
  platform: format === "cjs" ? "node" : "browser", //打包平台
  watch: {
    onRebuild(err) {
      if (!err) console.info(`${target}.${format}.js 打包完成`);
    },
  },
}).then(() => {
  console.log(`${target}.${format}.js 打包完成`);
});
