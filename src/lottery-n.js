const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();
const {
  Message,
  ErrorMessage,
  pickRandom,
  slashcommand
} = require("./util.js");

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

exports.slashLotteryN = slashcommand(lotteryN);
