const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const cache = {};

function getConfig(configFileName, callback) {
  //configuring parameters
  const params = {
    Bucket: 'auth-config.experoinc.com',
    Key: configFileName
  };

  s3.getObject(params, function (err, data) {
    if (err) {
      callback(err, null);
    }
    else {
      const config = data && data.Body && JSON.parse(data.Body.toString());
      callback(null, config);
    }
  });
}

function getConfigCached(request, callback) {
  const configFileName = `${request.headers.host[0].value}.json`;
  const entry = cache[configFileName];
  if (entry && ((Date.now() - entry.time) < (5 * 60 * 1000))) // if entry is less than 5 minutes old
  {
    return callback(null, entry);
  }

  getConfig(configFileName, (err, result) => {
    if (!err) {
      result.time = Date.now();
      cache[configFileName] = result;
    }
    callback(err, result);
  });
}

module.exports = getConfigCached;
