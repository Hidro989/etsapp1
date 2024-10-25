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
import Review, {
  loadReview,
  storeReview,
  getReviewsByProductId,
  deleteReviewById,
  getReviewsByCustomerIdAndProductId,
  getAllReviews,
  approveReviewById,
} from "../app/models/Review.js";

const app = express();

const ETSValidate = {
  validate(rule, currentValue, comparativeValue) {
    let validateFunc = {
      min: (currentValue, comparativeValue) => {
        currentValue = parseFloat(currentValue);
        comparativeValue = parseFloat(comparativeValue);

        return currentValue >= comparativeValue;
      },
      max: (currentValue, comparativeValue) => {
        if (typeof currentValue === "string") {
          currentValue = parseFloat(
            this.unescapeHtml(currentValue).trim().length
          );
        } else {
          currentValue = parseFloat(currentValue);
        }

        comparativeValue = parseFloat(comparativeValue);

        return currentValue <= comparativeValue;
      },
      required: (currentValue) => {
        if (!currentValue) {
          return false;
        }
        return currentValue.length > 0;
      },
      email: (currentValue) => {
        if (currentValue){
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(currentValue);
        }
        return true;
      }
    };

    return validateFunc[rule](currentValue, comparativeValue);
  },

  escapeHtml(html) {
    const entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;",
    };
    return String(html)
      .replace(/[&<>"'/]/g, (s) => entityMap[s])
      .trim();
  },

  unescapeHtml(escapedHtml) {
    const entityMapReverse = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&#x2F;": "/",
    };

    return String(escapedHtml)
      .replace(
        /(&amp;|&lt;|&gt;|&quot;|&#39;|&#x2F;)/g,
        (s) => entityMapReverse[s]
      )
      .trim();
  },

  validateFields(data) {
    const errors = {};

    for (const field in data) {
      const fieldData = data[field];
      const rules = fieldData.validateRule.split("|");

      rules.forEach((rule) => {
        const [ruleName, ruleValue] = rule.split(":");

        if (ruleName && !this.validate(ruleName, fieldData.value, ruleValue)) {
          if (!errors[fieldData.name]) {
            errors[fieldData.name] = [];
          }
          errors[fieldData.name].push(fieldData.validateMessage[ruleName]);
        }
      });
    }

    return errors ? errors : null;
  },
};

const getFormField = {
  ets_product_id: {
    type: "hidden",
    value: "",
    name: "ets_product_id",
    validateRule: "required",
    validateMessage: {
      required: "Please enter product id",
    },
  },
  ets_product_title: {
    type: "hidden",
    value: "",
    name: "ets_product_title",
    validateRule: "",
    validateMessage: {},
  },
  ets_customer_id: {
    type: "hidden",
    value: "",
    name: "ets_customer_id",
    validateRule: "required",
    validateMessage: {
      required: "Please enter customer id",
    },
  },
  ets_customer_name: {
    type: "hidden",
    value: "",
    name: "ets_customer_name",
    validateRule: "",
    validateMessage: {},
  },
  ets_customer_email: {
    type: "hidden",
    value: "",
    name: "ets_customer_email",
    validateRule: "required|email",
    validateMessage: {
      required: "Please enter customer email",
      email: "Invalid Email",
    },
  },
  ets_rating_radio: {
    type: "radio",
    name: "ets_rating_radio",
    value: 0,
    choices: [1, 2, 3, 4, 5],
    validateRule: "min:1|max:5",
    validateMessage: {
      min: "Please add your review",
      max: "Invalid rating score",
    },
  },
  ets_rating_message: {
    type: "textarea",
    name: "ets_rating_message",
    rows: 5,
    cols: 30,
    value: "",
    placeHolder: "Please enter your review",
    validateRule: "max:500",
    validateMessage: {
      max: "Maximum message length is 500 characters",
    },
  },
};

await Database.connect();

app.use("/shopify", authRoute);

// app.use("/shopify/*", validateAuthenticatedSession);

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

app.get("/shopify/reviews/approve", async (req, res) => {
  let reviewId = req.query.reviewId;
  try {
    await approveReviewById(reviewId);
    res.status(200).send({ status: "success", message: 'Update review successfully!!' });
  } catch (error) {
    console.log(error);
    res.status(200).send({ status: "error", error: error });
  }
});

app.get("/shopify/reviews", async (req, res) => {
  let reviews = [];
  try {
    reviews = await getAllReviews();
    res.status(200).send({ status: "success", reviews: reviews });
  } catch (error) {
    console.log(error);
    res.status(200).send({ status: "error", error: error });
  }
});

app.get("/getDataRating", async (req, res) => {
  let productID = req.query.productID;
  let customerID = req.query.customerID;
  let reviews = [],
    reviewOfCustomer = {};
  let formField = Object.assign({}, getFormField);

  if (productID) {
    try {
      reviewOfCustomer = await getReviewsByCustomerIdAndProductId(
        customerID,
        productID
      );
      reviews = await getReviewsByProductId(productID);

      if (reviewOfCustomer.length > 0) {
        formField.ets_rating_radio.value = reviewOfCustomer[0].rating;
        formField.ets_rating_message.value = reviewOfCustomer[0].message;
      } else {
        formField.ets_rating_radio.value = 0;
        formField.ets_rating_message.value = "";
      }

      res
        .status(200)
        .json({
          status: "success",
          data: { reviews, reviewOfCustomer, formField },
        });
    } catch (error) {
      console.log(error);
      res.status(200).json({ status: "error", message: error });
    }
  }
});

app.post("/saveRating", async (req, res) => {
  let formData = Object.assign({}, getFormField);
  for (const key in formData) {
    if (Object.prototype.hasOwnProperty.call(formData, key)) {
      const element = formData[key];
      element.value = req.body[element.name];
    }
  }
  const errors = ETSValidate.validateFields(formData);
  
  if (Object.keys(errors).length > 0) {
    res.status(200).json({ status: "error", error: errors });
  } else {
    if (
      await storeReview(
        new Review({
          _id: req.body.ets_review_id || undefined,
          productId: formData.ets_product_id.value,
          productTitle: formData.ets_product_title.value,
          customerId: formData.ets_customer_id.value,
          customerName: formData.ets_customer_name.value,
          customerEmail: formData.ets_customer_email.value,
          rating: formData.ets_rating_radio.value,
          message: formData.ets_rating_message.value,
        })
      )
    ) {
      res
        .status(200)
        .json({ status: "success", message: "Rating đã được lưu thành công!" });
    } else {
      res.status(200).json({ status: "error", error: errors });
    }
  }
});

app.get("/deleteRating", async (req, res) => {
  if (req.query.reviewId) {
    try {
      await deleteReviewById(req.query.reviewId);
      res
        .status(200)
        .json({ status: "success", message: "Rating đã được xóa thành công!" });
    } catch (error) {
      console.log(error);
      res.status(200).json({ status: "error", message: error });
    }
  }
});

// app.use(cspHeaders);

// const authController = new AuthController();
// app.use("/shopify/*", authController.ensureInstalledOnShop, async (_req, res) => {
//   const frontendUrl = process.env.APP_URL || "https://huydev.deskbox.org";
//   res.redirect(frontendUrl);
// });

export default app;
