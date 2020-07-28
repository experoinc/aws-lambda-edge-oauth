const AWS = require('aws-sdk');

const AWS_DEFAULT_REGION = 'us-east-1';
const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager({region: AWS_DEFAULT_REGION});
const cache = {};

function getConfiguration(request, callback) {
  var params = {
    SecretId: '<aws-secrets-manager-id>',
  };
  
  secretsManager.getSecretValue(params, function(err, data) {
    if (err) {
      console.error(err);
      callback(err, err.stack);
    }
    else {
      const config = data && data.SecretString && JSON.parse(data.SecretString);
      callback(null, config);
    }
  });

}

module.exports = getConfiguration;
