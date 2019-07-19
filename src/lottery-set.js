const { Datastore } = require("@google-cloud/datastore");
const datastore = new Datastore();
const { Message, ErrorMessage, slashcommand } = require("./util.js");

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

exports.slashLotterySet = slashcommand(setGroup);
