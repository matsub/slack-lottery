const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();

function bare(uname) {
  const matched = uname.match(/<.*\|(.*)>/);

  if (matched === null) {
    return uname;
  }

  return matched[1];
}

async function setGroup(req) {
  // validate format
  if (!/[^ ]* .*/.test(req.body.text)) {
    return "Usage: /lottery-set [group] [[@user],...]";
  }

  const [group, ...users] = req.body.text.split(/[, ]+/);
  const key = datastore.key("slashLottery");
  const entity = { key, data: { group, users } };

  await datastore.save(entity);

  return `Registered.\n${group}: ${users}`;
}

async function lottery(req) {
  const [group, text] = req.body.text.split(/ (.*)/);

  const query = datastore
    .createQuery("slashLottery")
    .filter("group", "=", group);
  const [[entity]] = await datastore.runQuery(query);

  if (entity.users === undefined) {
    return `Could not found group: ${group}`;
  }

  const user = pickRandom(entity.users);

  return `${user} ${text}`;
}

async function lotteryN(req) {
  const matched = req.body.text.match(/(\d+) (.*?) (.*)/);

  if (matched === null) {
    return "Usage: /lottery-n [num-o-pick] [group] [message]";
  }

  const [, num, group, text] = matched;

  const query = datastore
    .createQuery("slashLottery")
    .filter("group", "=", group);
  const [[entity]] = await datastore.runQuery(query);

  if (entity.users === undefined) {
    return `Could not found group: ${group}`;
  }

  const users = [];
  for (let i = 0; i < num; i++) {
    const unpickedUsers = entity.users.filter(x => !users.includes(x));
    const user = pickRandom(unpickedUsers);
    users.push(user);
  }

  return `${users.join(" ")} ${text}`;
}

async function lsGroup() {
  const query = datastore.createQuery("slashLottery");

  const [entities] = await datastore.runQuery(query);
  const groups = entities.map(e => `${e.group}: ${e.users.map(bare)}`);

  return groups.join("\n");
}

async function unsetGroup(req) {
  const group = req.body.text;
  const query = datastore
    .createQuery("slashLottery")
    .filter("group", "=", group);

  const [[entity]] = await datastore.runQuery(query);
  const key = entity[datastore.KEY];

  await datastore.delete(key);

  return `Unregistered: ${group}`;
}

// pick a random element from an array
function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function slashcommand(feature) {
  return async (req, res) => {
    const text = await feature(req);
    const msg = { response_type: "in_channel", text };

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(msg));
  };
}

exports.slashLottery = slashcommand(lottery);
exports.slashLotteryN = slashcommand(lotteryN);
exports.slashLotterySet = slashcommand(setGroup);
exports.slashLotteryUnset = slashcommand(unsetGroup);
exports.slashLotteryLs = slashcommand(lsGroup);
