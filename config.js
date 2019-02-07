const AWS = require('aws-sdk');

const DOMAIN_SUFFIX = '.s3.amazonaws.com';

const s3 = new AWS.S3();

function getConfig(request, callback) {
  // Assumes that the s3 domain name is in the format: `bucketName` + `DOMAIN_SUFFIX`.
  const bucketName = request.origin.s3.domainName.substr(0,
    request.origin.s3.domainName.length - DOMAIN_SUFFIX.length)
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

module.exports = getConfig;
