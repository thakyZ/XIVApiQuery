const XIVAPI = require("@xivapi/js");
const xiv = new XIVAPI();
const fsSync = require("fs");
const fs = require("fs").promises;
const path = require("path");
const cliProgress = require('cli-progress');
const stripJsonComments = require('strip-json-comments');

const config = path.join(__dirname, "config.json");
const out = path.join(__dirname, "out.json");
const bar1 = new cliProgress.SingleBar({ hideCursor: true, format: "[{bar}] {percentage}% | Duration: {duration_formatted} | ETA: {eta_formatted} | {value}/{total}", formatTime: cliProgress.formatTime }, cliProgress.Presets.shades_classic);

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
      console.error({ message: error.message, stack: error.stack });
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
  let res;
  try {
    //find item
    res = await xiv.data.list(search.class);
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  try {
    //res = JSON.parse(res);
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  if (res.Pagination.ResultsTotal > 0) {
    res = await find(search, res);
  }
  return res;
};

const run = async () => {
  if (!fsSync.existsSync(config)) {
    console.error({ message: `Config, ${config} does not exist.` });
    return;
  }
  let gottenConfig;
  try {
    gottenConfig = await fs.readFile(config, { encoding: "utf-8" });
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  gottenConfig = JSON.parse(stripJsonComments(gottenConfig));
  try {
    var gotten = await getString(gottenConfig);
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  try {
    gotten = JSON.stringify(gotten);
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
  console.log(gotten);
  try {
    await fs.writeFile(out, gotten, { encoding: "utf-8", flag: "w", mode: 0o666 });
  } catch (error) {
    console.error({ message: error.message, stack: error.stack });
  }
};

run();