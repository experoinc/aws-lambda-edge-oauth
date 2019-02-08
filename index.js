'use strict';

const querystring = require('querystring');
const https = require("https");
const jsonwebtoken = require('jsonwebtoken');
const getConfigCached = require("./config");
const {redirect, respond} = require("./helpers");

const PUBLIC_PATHS = [/\/favicons\//];

function parseCookies(headers) {
  const parsedCookie = {};
  if (headers.cookie) {
    headers.cookie[0].value.split(';').forEach((cookie) => {
      if (cookie) {
        const parts = cookie.split('=');
        parsedCookie[parts[0].trim()] = parts[1].trim();
      }
    });
  }
  return parsedCookie;
}

function validateToken(config, token) {
  try {
    const decoded = jsonwebtoken.verify(token, config.certificate, {
      algorithms: [config.AUTH0_ALGORITHM],
      audience: config.AUTH0_CLIENT_ID,
    });

    return true;
  }
  catch (err) {
    return false;
  }
}

function validateCookie(config, cookie) {
  return !!cookie && validateToken(config, cookie);
}

function loginCallback(config, request, callback) {
  if (request.uri !== config.CALLBACK_PATH) {
    return false;
  } // unhandled

  let params;
  try {
    params = querystring.parse(request.querystring);
    if (params.error) {
      callback(null, respond(401, "Unauthorized", params.error, params.error_description));
      return true; // handled
    }
    if (!params.code) {
      return false; // unhandled
    }
  }
  catch (err) {
    return false; // unhandled
  }

  // Call Auth0 to get JWT token
  const headers = request.headers;
  const postData = querystring.stringify({
    client_id: config.AUTH0_CLIENT_ID,
    redirect_uri: `https://${headers.host[0].value}${config.CALLBACK_PATH}`,
    client_secret: config.AUTH0_CLIENT_SECRET,
    code: params.code,
    grant_type: "authorization_code"
  });
  const postOptions = {
    host: config.AUTH0_DOMAIN,
    port: 443,
    path: "/oauth/token",
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };
  const req = https.request(postOptions, res => {
    if (res.statusCode >= 300) {
      return callback(null, respond(500, "Internal Server Error", "Bad token response", `Bad Token Response: ${res.statusCode} ${res.statusText}`));
    }

    let body = "";
    res.on('data', d => body += d);
    res.on('end', () => {
      try {
        const json = JSON.parse(body);
        const token = json.id_token;

        if (!token) {
          return callback(null, respond(401, "Unauthorized", "Unauthorized", body));
        }

        // store this in a cookie, then redirect the user
        const dest = `https://${headers.host[0].value}${params.dest || "/"}`;
        callback(null, redirect(dest, [{name: "session-token", value: token}]));
      }
      catch (e) {
        callback(e, null);
      }
    });
  });
  req.on("error", e => callback(e, null));
  req.write(postData);
  req.end();

  return true; // handled
}

function redirectIfNotAuthenticated(config, request, callback) {
  const headers = request.headers;

  /* Check for session-id in request cookie in viewer-request event,
   * if session-id is absent, redirect the user to sign in page with original
   * request sent as redirect_url in query params.
   */

  /* Check for session-id in cookie, if present then proceed with request */
  const parsedCookies = parseCookies(headers);
  if (validateCookie(config, parsedCookies && parsedCookies['session-token'])) {
    return false; // not handled
  }

  // User is not authenticated.
  /* URI encode the original request so we can send as query param for when user is finally logged in */
  const encodedRedirectUrl = encodeURIComponent(request.querystring ? `${request.uri}?${request.querystring}` : request.uri);
  const callbackUrl = `https://${headers.host[0].value}${config.CALLBACK_PATH}?dest=${encodedRedirectUrl}`;
  const encodedCallback = encodeURIComponent(callbackUrl);
  const redirectUrl = `${config.AUTH0_LOGIN_URL}?client=${config.AUTH0_CLIENT_ID}&redirect_uri=${encodedCallback}`;

  callback(null, redirect(redirectUrl, [{name: "session-token", value: ""}]));

  return true; // handled
}

function allowPublicPaths(config, request, callback) {
  if (PUBLIC_PATHS.find(pattern => pattern.test(request.uri))) {
    callback(null, request);
    return true;
  }
}

function requireConfig(config, request, callback) {
  if (!config) {
    callback(null, respond(500, "Internal Server Error", "Authentication Not Configured", "Authentication not configured for this website"));
    return true; // handled
  }
}

exports.handler = function (event, context, callback) {
  const request = event.Records[0].cf.request;
  
  getConfigCached(request, function (err, config) {
    if (err) {
      callback(err, null);
    }
    else if (
      !requireConfig(config, request, callback) &&
      !allowPublicPaths(config, request, callback) &&
      !loginCallback(config, request, callback) &&
      !redirectIfNotAuthenticated(config, request, callback)) {
      callback(null, request);
    }
  });
};

