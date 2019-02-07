const AWS = require('aws-sdk');

const DOMAIN_SUFFIX = '.s3.amazonaws.com';
const s3 = new AWS.S3();
const cache = {};

function getConfig(bucketName, callback) {
  //configuring parameters
  const params = {
    Bucket: bucketName,
    Key: 'auth-config.json'
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
  // Assumes that the s3 domain name is in the format: `bucketName` + `DOMAIN_SUFFIX`.
  const bucketName = request.origin.s3.domainName.substr(0,
    request.origin.s3.domainName.length - DOMAIN_SUFFIX.length);
  const entry = cache[bucketName];
  if (entry && ((Date.now() - entry.time) < (5 * 60 * 1000))) // if entry is less than 5 minutes old
  {
    return callback(null, entry);
  }

  getConfig(bucketName, (err, result) => {
    if (!err) {
      result.time = Date.now();
      cache[bucketName] = result;
    }

    callback(err, result);
  });
}

module.exports = getConfigCached;
