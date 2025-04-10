import express from "express";
import axios from "axios";
import { importJWK, SignJWT } from "jose";

const app = express();

const CLIENT_ID = "87beb6b5-cc02-4046-8a68-074dbe4b8499";
const AUDIENCE = "https://enel.in-voice.it/oauth2/token";

// Endpoint base
app.get("/", (req, res) => {
  res.send("✅ Server attivo!");
});

// Endpoint per ottenere JWT e Access Token
app.get("/token", async (req, res) => {
  try {
    // ✅ Legge il JWK dalle env vars (come stringa JSON)
    const jwk = JSON.parse(process.env.JWK);
    const privateKey = await importJWK(jwk, "RS256");

    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(CLIENT_ID)
      .setSubject(CLIENT_ID)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime("20m")
      .sign(privateKey);

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

    res.json({ access_token: response.data.access_token });
  } catch (err) {
    res.status(500).json({
      error: true,
      message: err.response?.data || err.message,
    });
  }
});

// 👇 ESPORTA per Vercel
export default app;
