const escape = require("lodash.escape");

function makeRedirect(newLocation, cookies) {
  const result = {
    status: '302',
    statusDescription: 'Found',
    headers: {
      location: [{
        key: 'Location',
        value: newLocation,
      }],
    },
  };

  if (cookies) {
    result.headers["set-cookie"] = cookies.map(c => ({key: "set-cookie", value: `${c.name}=${c.value}`}));
  }

  return result;
}

function makeResponse(status, statusText, title, message) {
  const body = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${escape(title)}</title>
  </head>
  <body>
    <p>${escape(message)}</p>
  </body>
</html>`;

  const result = {
    status: status,
    statusText: statusText,
    body: body
  };

  return result;
}

module.exports = {
  redirect: makeRedirect,
  respond: makeResponse,
};
