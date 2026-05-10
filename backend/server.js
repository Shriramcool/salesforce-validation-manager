const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const jsforce = require("jsforce");
const crypto = require("crypto");

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

const oauth2 = new jsforce.OAuth2({
  loginUrl: process.env.LOGIN_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
});

function base64URLEncode(str) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function sha256(buffer) {
  return crypto
    .createHash("sha256")
    .update(buffer)
    .digest();
}

app.get("/", (req, res) => {
  res.send("Salesforce Backend Running");
});

app.get("/login", (req, res) => {
  const codeVerifier = base64URLEncode(
    crypto.randomBytes(32)
  );

  const codeChallenge = base64URLEncode(
    sha256(codeVerifier)
  );

  req.session.codeVerifier =
    codeVerifier;

  const authUrl =
    oauth2.getAuthorizationUrl({
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const conn = new jsforce.Connection({
      oauth2,
    });

    const tokenResponse =
      await conn.oauth2.requestToken(
        code,
        {
          code_verifier:
            req.session.codeVerifier,
        }
      );

    req.session.accessToken =
      tokenResponse.access_token;

    req.session.instanceUrl =
      tokenResponse.instance_url;

    res.send(
      "Salesforce Login Successful"
    );
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .send("Authentication Failed");
  }
});

app.get(
  "/validation-rules",
  async (req, res) => {
    try {
      const conn =
        new jsforce.Connection({
          accessToken:
            req.session.accessToken,
          instanceUrl:
            req.session.instanceUrl,
        });

      const result =
        await conn.tooling.query(`
        SELECT Id, ValidationName, Active
        FROM ValidationRule
        WHERE EntityDefinition.QualifiedApiName = 'Account'
      `);

      res.json(result.records);
    } catch (error) {
      console.log(error);

      res
        .status(500)
        .send(
          "Failed to fetch validation rules"
        );
    }
  }
);

app.get(
  "/toggle-rule/:id",
  async (req, res) => {
    try {
      const conn =
        new jsforce.Connection({
          accessToken:
            req.session.accessToken,
          instanceUrl:
            req.session.instanceUrl,
        });

      const ruleId =
        req.params.id;

      await conn.tooling
        .sobject("ValidationRule")
        .update({
          Id: ruleId,
          Active: false,
        });

      res.json({
        success: true,
        message:
          "Validation rule deactivated",
      });
    } catch (error) {
      console.log(error);

      res
        .status(500)
        .send(
          "Failed to update validation rule"
        );
    }
  }
);

app.listen(5000, () => {
  console.log(
    "Server running on port 5000"
  );
});