const XIVAPI = require("@xivapi/js");
const xiv = new XIVAPI();
const fsSync = require("fs");
const fs = require("fs").promises;
const path = require("path");
const cliProgress = require('cli-progress');
const stripJsonComments = require('strip-json-comments');
const util = require("util");

const config = path.join(__dirname, "config.json");
const out = path.join(__dirname, "out.json");
let bar1 = undefined;

const sleep = ms => new Promise(r => setTimeout(r, ms));

const find = async (search, res) => {
  let ress;
  let id = 0;
  bar1.start(res.Pagination.ResultsTotal, search.startAtID, {
    speed: "N/A"
  });
  for (var i = search.startAtID; i <= res.Pagination.ResultsTotal; i++) {
    try {
      //find item
      ress = await xiv.data.get(search.class, i.toString());
      bar1.update(i);
    } catch (error) {
      console.error(error);
      break;
    }
    //ress = JSON.parse(ress);
    let resss = ress;
    for (var j = 0; j < search.keyTree.length; j++) {
      resss = resss[search.keyTree[j]];
    }
    if (resss.includes(search.string)) {
      id = i;
      bar1.stop();
      break;
    }
    await sleep(2000);
  }
  return ress;
};

const getString = async (search) => {
  bar1 = new cliProgress.SingleBar({ hideCursor: true, format: "[{bar}] {percentage}% | Duration: {duration_formatted} | ETA: {eta_formatted} | {value}/{total}", formatTime: cliProgress.formatTime }, cliProgress.Presets.shades_classic);
  let res;
  try {
    //find item
    res = await xiv.data.list(search.class);
    //res = JSON.parse(res);
    if (res.Pagination.ResultsTotal > 0) {
      res = await find(search, res);
    }
  } catch (error) {
    console.error(error);
  }
  return res;
};

const displayJson = json => {
  if (json.Url) {
    json.Url = `https://xivapi.com${json.Url}`;
  }
  console.log(util.inspect(json, {showHidden: false, depth: null, colors: true}));
};

async function run() {
  if (!fsSync.existsSync(config)) {
    console.error(new Error(`Config, ${config} does not exist.`));
    return;
  }

  try {
    let gotten = JSON.stringify(await getString(JSON.parse(stripJsonComments(await fs.readFile(config, { encoding: "utf-8" })))), null, 2);

    if (typeof gotten !== "undefined") {
      await fs.writeFile(out, gotten, { encoding: "utf-8", flag: "w" });
      displayJson(JSON.parse(gotten));
    }
  } catch (error) {
    console.error(error);
  }
}

(async function() {
  await run();
})();