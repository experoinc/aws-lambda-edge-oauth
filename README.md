Lamnda@Edge function which will protect static websites hosted in S3 and served by Cloudfront.  Visitors to the sites
will be required to authenticate with Auth0 before they can access the site.

[This article](https://www.experoinc.com/post/serverless-authentication) is based upon this code.

This one lambda is meant to protect multiple sites.

## First Time Use Steps

### Create an Auth Config S3 Bucket

The lambda is meant to protect multiple sites.  Thus it uses an S3 bucket to maintain the configuration for each
protected site.

Login to AWS and create an S3 bucket to hold these configurations.

### Edit `config.js` and tell it the name of your S3 bucket.

Find this code in `config.js`

```javascript
  const params = {
    Bucket: 'auth-config.experoinc.com',
    Key: configFileName
  };
```

Replace the bucket name (`auth-config.experoinc.com`) with the name of the S3 bucket you just created.

### Add your first site config to the bucket

The lambda looks for configurations based upon the request hostname.  So if your site is being served as
`https://my-awesome-site.com/foo`, then the lambda will look for a configuration file in the S3 bucket
called `my-awesome-site.com.json`.  If your site is hosted under multiple hostnames, then you'd have to add
a configuration for each hostname.

Here is what an auth configuration file looks like:

```json
{
  "certificate": "-----BEGIN CERTIFICATE-----\nxxxxxxxxxxxxxxxx\nyyyyyyyyyyyyyyy\nxxxxxxxxx\nyyyyyyyyyyyy\nxxxxxxx\nyyyyyy\nxxxxxx\nyyyyyyy\nxxxxxx\nyyyyyy8kTow==\n-----END CERTIFICATE-----",
  "AUTH0_CLIENT_ID": "xlkihjaskjhaskjjh",
  "AUTH0_CLIENT_SECRET": "sdlkjsdlkjsdlkjsdl/kjsd;lklksdjhlksjdh",
  "AUTH0_ALGORITHM": "RS256",
  "AUTH0_DOMAIN": "experoinc.auth0.com",
  "AUTH0_HOST": "https://experoinc.auth0.com",
  "AUTH0_LOGIN_URL": "https://experoinc.auth0.com/login",
  "CALLBACK_PATH": "/logincb"
}
```

Here is a description of each field:

* `certificate` - the public RSA key.  Retrieve from `https://<YOUR-AUTH0-DOMAIN>.auth0.com/pem`.  Make sure and replace all newlines with `\n` when pasting into the JSON string.  Make sure you do not have any embedded spaces!
* `AUTH0_CLIENT_ID` - the client id of the Auth0 Applicaton you are using to protect your site.  Get from your Auth0 dashboard
* `AUTH0_CLIENT_SECRET` - the client secret of the Auth0 Application.
* `AUTH0_CLIENT_ALGORITHM` - either `"RS256"` or `"HS256"` depending on how your Auth0 application is configured
* `AUTH0_DOMAIN` - your Auth0 domain, aka `your-auth0-tenant.auth0.com`
* `AUTH0_HOST` - the url to your auth0 tenant aka `https://your-auth0-tenant.auth0.com`
* `AUTH0_LOGIN_URL` - the url to your app's login page
* `CALLBACK_PATH` - the callback url the lambda should listen on for login responses from Auth0.  Leave as `"/logincb"` unless that conflicts with some route in your app.

### Configure your Auth0 App

There's just a few things you need to do in Auth0:

* Add the callback url to your Auth0 App's list of *Allowed Callback Urls*.  This should be the same callback path configured in the previous step.  Example: `https://my-awesome-site.com/logincb`
* Go into Advanced options for your Auth0 app, and disable OIDC-Conformant on the OAuth tab.  (the lambda method is not currently ODIC-Conformant)


### Add the Lambda to AWS

Build the distribution
* `yarn` - install dependencies
* `yarn run build` to build package.zip

Create the Lambda

* Goto Lamba in the AWS Console and create a new Lambda "From Scratch"
* Choose Node.js runtime
* Give your function a name
* Choose an execution role
* Ensure that whatever role you assign here has permission to *read* from config S3 bucket you made previously
* Create the Function
* In the new screen, goto Function Code and choose `Upload a zip file`
* Upload the `package.zip` you just built.
* Leave `index.handler` selected as the Handler
* Publish a new version of the function
* Deploy the function to Lambda@Edge
* Configure new CloudFront Trigger
* Select the Cloudfront distribution of your website
* Change the CloudFront event to `Viewer Request`
* Deploy

Wait a few minutes for the function to be distributed to the edge servers and for your cloudfront settings to update.  Then visit your website.  If all goes well, you'll get an auth0 prompt to login.

## Adding additional sites

* Add a new config json file to the S3 bucket for the new site
* Edit the Cloudfront distribution and edit the `Behavior`
* Add a `Lambda Function Associations`:
* Type: Viewer Request
* Lambda Function ARN: The ARN for the lambda function you deployed
* Include Body: No
* Save the changes and wait for them to propagate to the edge servers


## List of Improvements To Make

* Change the auth workflow so that it is OIDC-Comformant (this should eliminate the need for the client secret in the config)
* Improve the code workflow to fetch public keys on demand based on the standaed OAuth endpoints (eliminate the need to put the public key in the config)
* Change the code to work correctly with the `authorize` endpoint instead of login endpoint (conform to the standard better)
* Change the config keys to be more generic (not auth0-specific)

With those improvements, this function should be able to work with any standard OAuth provider, not just Auth0.
