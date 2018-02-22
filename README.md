Lamnda@Edge function which will protect static websites hosted in S3 and served by Cloudfront.  Visitors to the sites
will be required to authenticate with Auth0 before they can access the site.

This one lambda is meant to protect multiple sites

# How to add a new site

1. Edit `config.js` and add the new Auth0 client (and possibly new Auth0 tenant) to the `auth0Tenants` variable.
2. Edit `config.js` and add the new hostname to the `hostMapping` variable (telling the lambda which auth0 client to use for this site)
3. Run `yarn` to install dependencies if you have not already
4. Run `yarn run build` to build `package.zip`
5. Login to AWS, goto Lambda console and locate the `cf-trigger-auth0` lambda method in the **US East-1 (N. Virginia) Region**
6. Select the Lambda **LATEST** version and specify you wish to upload a new zip
7. Upload the package.zip and save.
8. Choose "Publish New Version" from Actions dropdown
9. Select the new version you published and add a `Cloudfront` trigger.
10. Configure the trigger by specifying the Cloudfront distribution you wish to protect and setting event trigger to **Viewer Request**.
11. Click Add
12. If you want to update multiple Cloudfront distributions for your change, repeat previous 2 steps for each distribution
13. When finished, click Save.
14. Wait a few minutes for the Lambda to be replicated
15. See if it works
