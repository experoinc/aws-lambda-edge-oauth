const fs = require("fs");

const auth0Tenants = {
  experoinc: {
    AUTH0_DOMAIN: "experoinc.auth0.com",
    certificateFile: "experoinc.pem",
    certificate: null,

    clients: {
      miranda: {
        AUTH0_CLIENT_ID: "iiNvM0syyAjyVwjg3UTCcEEVE1OzFcxq",
        AUTH0_CLIENT_SECRET: "8C8KA1298vdmadUrb8JKdY_qki2cE9JC0Fr9gAgYQkKBvuNX-iCFR659ilC6Mzmt",
        AUTH0_ALGORITHM: "RS256",
      },
      bankdemo: {
        AUTH0_CLIENT_ID: "qeiJKtyx7V526diSZ6LuvtL2peX2MbTv",
        AUTH0_CLIENT_SECRET: "yXlvP163PkaNdjfzqhgK8zGGjSOTllMwk-PIokR2D75uhyw_fdPk1Nq7nJZV_r3c",
        AUTH0_ALGORITHM: "RS256",
      supplychaindemo: {
        AUTH0_CLIENT_ID: "FG5Q84tgsNOwXQBDGpgl7UCOxedxyOPB",
        AUTH0_CLIENT_SECRET: "LCfV5slvJBzelJ9By8_oLq_GmWTJ91PcVXvpxmOImzUDLP-ss3-Yk8AokbChf4Cg",
        AUTH0_ALGORITHM: "RS256",
      }
    }
  }
};

function getCertificate(tenant) {
  if (!tenant.certificate) {
    tenant.certificate = fs.readFileSync(tenant.certificateFile);
  }

  return tenant.certificate;
}

const hostMapping = {
  "miranda.experolabs.com": { tenant: "experoinc", client: "miranda" },
  "miranda-docs.experolabs.com": { tenant: "experoinc", client: "miranda" },
  "supplychain-demo.experolabs.com": { tenant: "experoinc", client: "supplychaindemo" },
  "bank-demo.experolabs.com": { tenant: "experoinc", client: "bankdemo" },
};

function getConfig(request) {
  const host = request.headers.host[0].value;
  const c = hostMapping[host];

  if (!c) {
    return null;
  }

  const tenant = auth0Tenants[c.tenant];
  const client = tenant && tenant.clients[c.client];
  if (!client) {
    return null;
  }

  return {
    AUTH0_CLIENT_ID: client.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: client.AUTH0_CLIENT_SECRET,
    AUTH0_ALGORITHM: client.AUTH0_ALGORITHM,
    AUTH0_DOMAIN: tenant.AUTH0_DOMAIN,
    AUTH0_HOST: `https://${tenant.AUTH0_DOMAIN}`,
    AUTH0_LOGIN_URL: `https://${tenant.AUTH0_DOMAIN}/login`,
    CALLBACK_PATH: "/logincb",
    getCertificate: () => getCertificate(tenant)
  };
}

module.exports = getConfig;
