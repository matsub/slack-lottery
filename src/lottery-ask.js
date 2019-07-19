const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();
const {
  Message,
  ErrorMessage,
  pickRandom,
  slashcommand
} = require("./util.js");

// Cloud Function: /lottery-ask
async function lotteryAsk(req) {
  const [group, text] = req.body.text.split(/ (.*)/);

  const query = datastore
    .createQuery("slashLottery")
    .filter("group", "=", group);
  const [[entity]] = await datastore.runQuery(query);

  if (entity === undefined) {
    return new ErrorMessage(`Could not found group: ${group}`);
  }

  const originatorPattern = new RegExp(req.body.user_id);
  const asked = entity.users.filter(u => !originatorPattern.test(u));
  const user = pickRandom(asked);

  if (text === undefined) {
    return new Message(user);
  }

  return new Message(`${user} ${text}`);
}

exports.slashLotteryAsk = slashcommand(lotteryAsk);
