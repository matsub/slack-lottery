const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();
const { Message, bare, slashcommand } = require("./util.js");

// Cloud Function: /lottery-ls
async function lsGroup() {
  const query = datastore.createQuery("slashLottery");

  const [entities] = await datastore.runQuery(query);
  const groups = entities.map(e => `${e.group}: ${e.users.map(bare)}`);

  return new Message(groups.join("\n"));
}

exports.slashLotteryLs = slashcommand(lsGroup);
