import express from "express";
import authRoute from "./authRoute.js";
import shopify from "../configs/shopify.js";
import Session from "../app/models/Session.js";
import { Session as SessionShopify } from "@shopify/shopify-api";
import { Database } from "../configs/database.js";
import { validateAuthenticatedSession } from "../app/lib/validateAuthenticatedSession.js";
import { cspHeaders } from "../app/lib/cspHeader.js";
import AuthController from "../app/controllers/AuthController.js";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

await Database.connect();

app.use("/shopify", authRoute);

// app.use("/*", validateAuthenticatedSession);

app.get("/shopify/products", async (_req, res) => {
  if (_req.headers.referer) {
    const urlObj = new URL(_req.headers.referer);
    const shop = urlObj.searchParams.get("shop");
    let dbSession = await Session.findOne({ shop: shop });

    if (dbSession) {
      dbSession = new SessionShopify({
        id: dbSession.session_id,
        shop: dbSession.shop,
        state: dbSession.state,
        scope: dbSession.scope,
        accessToken: dbSession.access_token,
        expires: dbSession.expires_at,
        isOnline: dbSession.is_online,
        onlineAccessInfo: dbSession.online_access_info,
      });

      let cursor = _req.query.cursor || null;
      let mode = _req.query.mode || "next";

      let generalQuery = `edges {
                      node {
                        id
                        title
                        onlineStorePreviewUrl
                        status
                        totalInventory
                        images(first: 1) {
                          edges {
                            node {
                              url
                              altText
                            }
                          }
                        }
                        collections(first: 5) {
                          edges {
                            node {
                              id
                              title
                            }
                          }
                        } 
                        productType
                        vendor
                      }
                    }`;

      let query = "";
      if (mode === "next") {
        query = `query{
                      products(first: 50, ${
                        cursor ? ',after:"' + cursor + '"' : ""
                      }) {
                              ${generalQuery}
                              pageInfo {
                                hasNextPage
                                endCursor
                                hasPreviousPage
                                startCursor
                              }
                            }
                  }`;
      } else {
        query = `query{
          products(last: 50, ${cursor ? ',before:"' + cursor + '"' : ""}) {
                  ${generalQuery}
                  pageInfo {
                    hasPreviousPage
                    startCursor
                    hasNextPage
                    endCursor
                  }
                }
      }`;
      }

      const client = new shopify.clients.Graphql({ session: dbSession });

      const response = await client.request(query);

      res.status(200).send({ products: response.data.products });
    }
  } else {
    res.status(200).send({ sucesss: "error", message: "Not Found Session" });
  }
});

const corsOptions = {
  origin: "https://hydroshop998.myshopify.com",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());

app.get("/getDataRating", async (req, res) => {
  res.status(200).json({status: 'success', data: {} });
});

app.post("/saveRating", async (req, res) => {
  const {
    productID,
    rating,
    msg,
    productTitle,
    customerID,
    customerName,
    customerEmail,
  } = req.body;

  if (typeof rating !== 'number') {
    return res.status(200).json({ status: 'error', error: 'Dữ liệu không hợp lệ' });
  }

  console.log("Rating:", rating);
  console.log("Message:", msg);
  console.log("productID:", productID);
  console.log("productTitle:", productTitle);
  console.log("customerID:", customerID);
  console.log("customerName:", customerName);
  console.log("customerEmail:", customerEmail);

  res.status(200).json({status: 'success', message: "Rating đã được lưu thành công!" });
});

// app.use(cspHeaders);

// const authController = new AuthController();
// app.use("/shopify/*", authController.ensureInstalledOnShop, async (_req, res) => {
//   const frontendUrl = process.env.APP_URL || "https://huydev.deskbox.org";
//   res.redirect(frontendUrl);
// });

export default app;
