const TEST_GRAPHQL_QUERY = `query shopifyAppShopName {
    shop {
      name
    }
  }`;

export async function hasValidAccessToken(api, session) {
    try {
      const client = new api.clients.Graphql({ session });
      await client.request(TEST_GRAPHQL_QUERY);
      return true;
    } catch (error) {
      if (error instanceof HttpResponseError && error.response.code === 401) {
        // Re-authenticate if we get a 401 response
        return false;
      } else {
        throw error;
      }
    }
  }
  