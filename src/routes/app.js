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
import Review, {loadReview, storeReview, getReviewsByProductId, deleteReviewById, getReviewsByCustomerIdAndProductId} from '../app/models/Review.js';

const app = express();

const getFormField = {
  rating: {
    type:'radio',
    name: 'ets-rating-radio',
    value: 0,
    choices: [1,2,3,4,5],
    validateRule: 'min:1|max:5',
    validateMessage: {
      'min': 'Please add your review',
      'max': 'Invalid rating score',
    }
  },
  msg: {
    type: 'textarea',
    name: 'ets-rating-messsage',
    rows: 5,
    cols: 30,
    value: '',
    placeHolder: 'Please enter your review',
    validateRule: 'max:500',
    validateMessage: {
      'max': 'Maximum message length is 500 characters',
    }
  }
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


app.get("/getDataRating", async (req, res) => {
  let productID = req.query.productID;
  let customerID = req.query.customerID;
  let reviews = [],
      reviewOfCustomer = {};
  let formField = getFormField;

  if (productID) {
    try {
      reviewOfCustomer = await getReviewsByCustomerIdAndProductId(customerID,productID);
      reviews = await getReviewsByProductId(productID);

      if (Object.keys(reviewOfCustomer).length > 0) {
        formField.rating.value = reviewOfCustomer.rating;
        formField.msg.value = reviewOfCustomer.message;
      }

      res.status(200).json({status: 'success', data: {reviews: [
        {
          "_id": "64a9bca8f00b2c001c66e1b9",
          "productId": "12345",
          "customerId": "67890",
          "email": "customer@example.com",
          "customerName": "John Doe",
          "rating": 5,
          "message": "Great product!",
          "ratingStatus": "approved",
          "createdAt": "2023-10-23T10:00:00Z",
          "updatedAt": "2023-10-23T10:00:00Z"
        },
        {
          "_id": "64a9bca8f00b2c001c66e1ba",
          "productId": "12345",
          "customerId": "67891",
          "email": "another@example.com",
          "customerName": "Jane Smith",
          "rating": 4,
          "message": "Good quality!",
          "ratingStatus": "approved",
          "createdAt": "2023-10-23T11:00:00Z",
          "updatedAt": "2023-10-23T11:00:00Z"
        }
      ]
      , reviewOfCustomer, formField} });
    }catch(error) {
      console.log(error);
      res.status(200).json({status: 'error', message: error});
    }
  }
});

function validateForm(formData, formField) {
  let errors = {};

  const ratingField = formField.rating;
  const ratingValue = formData.rating;
  
  const ratingRules = ratingField.validateRule.split('|');
  let ratingMin = null;
  let ratingMax = null;

  ratingRules.forEach(rule => {
    const [ruleName, ruleValue] = rule.split(':');
    if (ruleName === 'min') ratingMin = parseInt(ruleValue, 10);
    if (ruleName === 'max') ratingMax = parseInt(ruleValue, 10);
  });

  if (ratingMin !== null && ratingValue < ratingMin) {
    errors.rating = ratingField.validateMessage.min;
  } else if (ratingMax !== null && ratingValue > ratingMax) {
    errors.rating = ratingField.validateMessage.max;
  }

  const msgField = formField.msg;
  const msgValue = formData.msg;

  const msgRules = msgField.validateRule.split('|');
  let msgMax = null;

  msgRules.forEach(rule => {
    const [ruleName, ruleValue] = rule.split(':');
    if (ruleName === 'max') msgMax = parseInt(ruleValue, 10);
  });

  if (msgMax !== null && msgValue.length > msgMax) {
    errors.msg = msgField.validateMessage.max;
  }

  return errors;
}



app.post("/saveRating", async (req, res) => {
  // const formData = {
  //   productID: req.body.productID,
  //   rating: parseInt(req.body.rating, 10),
  //   msg: req.body.msg,
  //   productTitle: req.body.productTitle,
  //   customerID: req.body.customerID,
  //   customerName: req.body.customerName,
  //   customerEmail: req.body.customerEmail,
  // };

  const formData = {
    productID: req.body.productID,
    rating: 0,
    msg: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris ac purus lacus. Mauris placerat orci eu felis laoreet placerat. Duis suscipit velit leo, et pharetra ipsum consequat ac. Duis laoreet vulputate ipsum at luctus. Vivamus scelerisque tincidunt lectus ut fringilla. Phasellus vestibulum sapien leo, sit amet ornare lorem consequat in. Quisque pretium justo nisi, at eleifend orci condimentum sed. Etiam dignissim hendrerit egestas. Morbi ac felis ante. Phasellus mi nisl, ultrices porttitor fermentum ut, scelerisque eu ipsum. Nam bibendum suscipit magna. Donec in nisi vel justo mattis hendrerit eu id mi. Duis sit amet lectus nibh. Fusce ut magna sed sem euismod dictum nec vitae metus. Sed fringilla sagittis varius.

Suspendisse sed diam vitae enim imperdiet accumsan. In placerat est sed ex rhoncus placerat. Cras faucibus rutrum enim, non tristique odio malesuada at. Pellentesque vehicula, ipsum ut dapibus fringilla, odio purus laoreet odio, eu ullamcorper magna nunc id sapien. Vivamus hendrerit quis orci in auctor. Nulla vitae tortor in enim porttitor pellentesque sit amet nec velit. In non placerat lacus. Proin et sodales orci. In placerat sem id augue auctor, sit amet fermentum sem pulvinar. Duis dictum elementum lobortis. Nunc eget ligula condimentum ante consectetur volutpat. Pellentesque hendrerit nisi nec venenatis bibendum. Duis iaculis mollis consectetur.

Cras consequat in metus quis eleifend. Donec interdum vulputate sapien, nec vestibulum risus sollicitudin quis. Ut egestas lobortis felis, quis fringilla diam porttitor a. Nunc maximus congue mollis. Vivamus pellentesque lacus vitae nisl consectetur ultricies. Vivamus id congue ex, ultricies sollicitudin orci. Donec sed vulputate nulla. Suspendisse eu dolor consectetur, aliquet odio id, ullamcorper turpis.

Suspendisse id leo nibh. Cras vel varius purus. Maecenas ornare ornare suscipit. Fusce non risus vel justo interdum condimentum. Sed eget varius est. Aenean hendrerit eleifend lectus nec condimentum. Quisque sed quam porta, faucibus mauris a, laoreet arcu. Vivamus sit amet nisl id magna euismod vehicula in eget lorem. Fusce viverra sollicitudin tincidunt. Pellentesque rhoncus sapien a lectus lacinia, sit amet tincidunt eros tempor. Donec eu venenatis mi. Ut condimentum leo justo, dictum mollis metus dignissim at. Aenean gravida est at auctor pulvinar. Nulla facilisi.

Nam mi diam, cursus non aliquet ac, tincidunt eu est. Duis efficitur pretium mi quis mollis. Nullam ultrices vitae urna ut sodales. Integer semper tincidunt orci a pulvinar. In at pharetra nisl. Sed ullamcorper, tellus sit amet lacinia rhoncus, purus ante gravida dui, vitae tristique magna lectus eget arcu. Nunc nec sagittis tellus.

Ut cursus efficitur massa, non varius magna. Donec a velit fermentum, semper massa eu, pellentesque nisi. Cras sodales ex ligula, sit amet ultrices turpis semper ultrices. Phasellus non ligula tempus, elementum augue a, ornare turpis. Nulla sit amet ex maximus, ultrices lectus id, sollicitudin purus. Ut varius mauris lacus, ac semper tellus tristique vitae. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Sed non molestie massa, vitae scelerisque tortor. Morbi massa eros, volutpat sed erat vulputate, euismod mattis tortor. Vivamus feugiat tortor neque, quis sodales orci rhoncus eget. Morbi sed augue finibus, ornare ex sed, consequat neque. Cras.`,
    productTitle: req.body.productTitle,
    customerID: req.body.customerID,
    customerName: req.body.customerName,
    customerEmail: req.body.customerEmail,
  };

  const errors = validateForm(formData, getFormField);
  console.log(errors);
  

  res.status(200).json({status: 'success', message: "Rating đã được lưu thành công!" });
});

// app.use(cspHeaders);

// const authController = new AuthController();
// app.use("/shopify/*", authController.ensureInstalledOnShop, async (_req, res) => {
//   const frontendUrl = process.env.APP_URL || "https://huydev.deskbox.org";
//   res.redirect(frontendUrl);
// });

export default app;
