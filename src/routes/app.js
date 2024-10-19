import express from "express";
import authRoute from "./authRoute.js";
import shopify from "../configs/shopify.js";
import Session from "../app/models/Session.js";
import { Session as SessionShopify } from "@shopify/shopify-api";
import { Database } from "../configs/database.js";
const app = express();

await Database.connect();

app.use("/", authRoute);

app.get("/products", async (_req, res) => {
  let tmpReferer =
    "https://huydev.deskbox.org/etsapp1/dev/?embedded=1&hmac=e1f6e8e81a4f5e448583a666def410c621bc289ab03286aebffe996000ce111e&host=YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvaHlkcm9zaG9wOTk4&id_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczpcL1wvaHlkcm9zaG9wOTk4Lm15c2hvcGlmeS5jb21cL2FkbWluIiwiZGVzdCI6Imh0dHBzOlwvXC9oeWRyb3Nob3A5OTgubXlzaG9waWZ5LmNvbSIsImF1ZCI6IjhhMTIwNjg3NDA4Mjg0OWMyNDQzYjkzODAwODdiOGM1Iiwic3ViIjoiMTA4MDYzNTg4NjYwIiwiZXhwIjoxNzI5MjQzNTQ2LCJuYmYiOjE3MjkyNDM0ODYsImlhdCI6MTcyOTI0MzQ4NiwianRpIjoiM2JlMmI5OTYtMDMyZS00NGRkLWIwNjQtNmFiY2NhNjIyMTJiIiwic2lkIjoiNmZkY2Q4YzAtZGYwMi00ODU1LWEwZDYtNDAyNDc1ZDIyYWMzIiwic2lnIjoiYTdiMTcxYjE3ZjU1YjZhYzc1NDdhZDQxMGQxNDNlMDUwZGRhZjIzOTRmNzE2MzFiNTRiMDgyOTE4YjlkMTZmMCJ9.LxeHraAXNwPQMCN2RiFQRlblval_3yYVVFaxe9QJfv4&locale=en-US&session=729d18cadd547ba4cdf16a810a806018c377b5da692cea58fd416d9aae142301&shop=hydroshop998.myshopify.com&timestamp=1729243486";
  if (tmpReferer) {
    //_req.headers.referer
    // const urlObj = new URL(_req.headers.referer);
    const urlObj = new URL(tmpReferer);
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
      let mode = _req.query.mode || 'next';
      
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

      let query = '';
      if (mode === 'next') {
          query = `query{
                      products(first: 50, ${ cursor ? (',after:"'+ cursor +'"'): ''}) {
                              ${generalQuery}
                              pageInfo {
                                hasNextPage
                                endCursor
                                hasPreviousPage
                                startCursor
                              }
                            }
                  }`
      }else {
        query = `query{
          products(last: 50, ${ cursor ? (',before:"'+ cursor +'"'): ''}) {
                  ${generalQuery}
                  pageInfo {
                    hasPreviousPage
                    startCursor
                    hasNextPage
                    endCursor
                  }
                }
      }`
      }             
      
      const client = new shopify.clients.Graphql({ session: dbSession });
      
      const response = await client.request( query );


      res.status(200).send({ products: response.data.products });
    }
  } else {
    res.status(200).send({ sucesss: "error", message: "Not Found Session" });
  }
});

export default app;
