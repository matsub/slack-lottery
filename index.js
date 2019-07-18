const { Datastore } = require("@google-cloud/datastore");
const fetch = require("node-fetch");
const datastore = new Datastore();

class Message {
  constructor(content) {
    this._content = content;
    this._response_type = "in_channel";
  }

  set channel(channel_id) {
    this._channel_id = channel_id;
  }

  get channel() {
    return this._channel_id;
  }

  get body() {
    const message = {
      response_type: this._response_type,
      text: this._content
    };

    return JSON.stringify(message);
  }
}

class ErrorMessage extends Message {
  constructor(content) {
    super(content);
    this._response_type = "ephemeral";
  }
}

// pick a random element from an array
function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// bare user name from uname string
function bare(uname) {
  const matched = uname.match(/<.*\|(.*)>/);

  if (matched === null) {
    return uname;
  }

  return matched[1];
}

// Cloud Function: /lottery
async function lottery(req) {
  const [group, text] = req.body.text.split(/ (.*)/);

  const query = datastore
    .createQuery("slashLottery")
    .filter("group", "=", group);
  const [[entity]] = await datastore.runQuery(query);

  if (entity === undefined) {
    return new ErrorMessage(`Could not found group: ${group}`);
  }

  const user = pickRandom(entity.users);

  if (text === undefined) {
    return new Message(user);
  }

  return new Message(`${user} ${text}`);
}

// Cloud Function: /lottery-n
async function lotteryN(req) {
  if (!/\d+ .*/.test(req.body.text)) {
    return new ErrorMessage("Usage: /lottery-n [num-o-pick] [group] [message]");
  }

  const extracted = req.body.text.match(/(\d+) (.*?) (.*)/);
  const [, num, group, text] = extracted;

  const query = datastore
    .createQuery("slashLottery")
    .filter("group", "=", group);
  const [[entity]] = await datastore.runQuery(query);

  if (entity === undefined) {
    return new ErrorMessage(`Could not found group: ${group}`);
  }

  const users = [];
  for (let i = 0; i < num; i++) {
    const unpickedUsers = entity.users.filter(x => !users.includes(x));
    const user = pickRandom(unpickedUsers);
    users.push(user);
  }

  return new Message(`${users.join(" ")} ${text}`);
}

// Cloud Function: /lottery-set
async function setGroup(req) {
  // validate format
  if (!/[^ ]* .*/.test(req.body.text)) {
    return new ErrorMessage("Usage: /lottery-set [group] [[@user],...]");
  }

  const [group, ...users] = req.body.text.split(/[, ]+/);
  const key = datastore.key("slashLottery");
  const entity = { key, data: { group, users } };

  await datastore.save(entity);

  return new Message(`Registered.\n${group}: ${users}`);
}

// Cloud Function: /lottery-unset
async function unsetGroup(req) {
  const group = req.body.text;
  const query = datastore
    .createQuery("slashLottery")
    .filter("group", "=", group);

  const [[entity]] = await datastore.runQuery(query);

  if (entity === undefined) {
    return new ErrorMessage(`Cannot find the group: ${group}`);
  }

  const key = entity[datastore.KEY];
  await datastore.delete(key);

  return new Message(`Unregistered: ${group}`);
}

// Cloud Function: /lottery-ls
async function lsGroup() {
  const query = datastore.createQuery("slashLottery");

  const [entities] = await datastore.runQuery(query);
  const groups = entities.map(e => `${e.group}: ${e.users.map(bare)}`);

  return new Message(groups.join("\n"));
}

function slashcommand(feature) {
  return async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({ text: "just a sec..." }));

    const message = await feature(req);
    message.channel = req.channel_id;

    const isSucceeded = !(message instanceof ErrorMessage);
    const apiMethod = isSucceeded ? "chat.postMessage" : "chat.postEphemeral";

    await fetch(`https://slack.com/api/${apiMethod}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${process.env.SLACK_TOKEN}` // Your app's xoxb- token value (available on the Install App page)
      },
      body: message.body
    });
  };
}

exports.slashLottery = slashcommand(lottery);
exports.slashLotteryN = slashcommand(lotteryN);
exports.slashLotterySet = slashcommand(setGroup);
exports.slashLotteryUnset = slashcommand(unsetGroup);
exports.slashLotteryLs = slashcommand(lsGroup);
