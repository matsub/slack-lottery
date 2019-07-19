const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();
const { Message, ErrorMessage, slashcommand } = require("./util.js");

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

exports.slashLotteryUnset = slashcommand(unsetGroup);
