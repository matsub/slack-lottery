const https = require("https");

async function post(apiMethod, data) {
  const options = {
    hostname: "slack.com",
    port: 443,
    path: `/api/${apiMethod}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${process.env.SLACK_TOKEN}` // Your app's xoxb- token value (available on the Install App page)
    }
  };

  const req = https.request(options, res => {
    console.log(`post: ${apiMethod}\nstatusCode: ${res.statusCode}`);

    res.on("data", data => {
      console.log(data);
    });
  });

  req.on("error", error => {
    console.error(error);
  });

  req.write(data);
  req.end();
}

class Message {
  constructor(content) {
    this._content = content;
  }

  set channel(channel_id) {
    this._channel_id = channel_id;
  }

  get channel() {
    return this._channel_id;
  }

  set user(user_id) {
    this._user_id = user_id;
  }

  get user() {
    return this._user_id;
  }

  get body() {
    const message = {
      text: this._content,
      channel: this.channel,
      user: this.user
    };
    return JSON.stringify(message);
  }
}

class ErrorMessage extends Message {}

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

function slashcommand(feature) {
  return async (req, res) => {
    res.status(200).send("");

    const message = await feature(req);
    message.channel = req.body.channel_id;

    const isSucceeded = !(message instanceof ErrorMessage);
    const apiMethod = isSucceeded ? "chat.postMessage" : "chat.postEphemeral";

    if (!isSucceeded) {
      message.user = req.body.user_id;
    }

    await post(apiMethod, message.body);
  };
}

module.exports = {
  Message,
  ErrorMessage,
  pickRandom,
  bare,
  slashcommand
};
