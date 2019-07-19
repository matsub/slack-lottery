const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();
const {
  Message,
  ErrorMessage,
  pickRandom,
  slashcommand
} = require("./util.js");

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

exports.slashLottery = slashcommand(lottery);
