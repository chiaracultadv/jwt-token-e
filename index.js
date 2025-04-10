import express from "express";
import fs from "fs/promises";
import axios from "axios";
import { importJWK, SignJWT } from "jose";

const app = express();
const PORT = 3000;

const CLIENT_ID = "87beb6b5-cc02-4046-8a68-074dbe4b8499";
const AUDIENCE = "https://enel.in-voice.it/oauth2/token";

// Endpoint base di test
app.get("/", (req, res) => {
  res.send("✅ Server attivo!");
});

// Endpoint per ottenere JWT e Access Token
app.get("/token", async (req, res) => {
  try {
    const jwkRaw = await fs.readFile("key.jwk.json", "utf-8");
    const jwk = JSON.parse(jwkRaw);
    const privateKey = await importJWK(jwk, "RS256");

    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(CLIENT_ID)
      .setSubject(CLIENT_ID)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("20m")
      .sign(privateKey);

    console.log("🔐 JWT generato:", jwt);

    const response = await axios.post(
      AUDIENCE,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        client_assertion: jwt,
        scope: "api.partner",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    console.log("✅ Access Token ricevuto:", response.data.access_token);
    res.json({ access_token: response.data.access_token });

  } catch (err) {
    console.error("❌ Errore:", err.response?.data || err.message);
    res.status(500).json({
      error: true,
      message: err.response?.data || err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server avviato su http://localhost:${PORT}`);
});
