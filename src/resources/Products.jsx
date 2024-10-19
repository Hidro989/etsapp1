import {
  Card,
  Page,
  Layout,
  TextContainer,
  Text,
  IndexTable,
  LegacyCard,
  useIndexResourceState,
  Badge,
  Thumbnail,
  Link,
  Icon,
} from "@shopify/polaris";

import { ViewIcon, ImageIcon } from "@shopify/polaris-icons";

import { useEffect, useState } from "react";

export default function Products() {
  const [products, setProducts] = useState({});
  const [endCursor, setEndCursor] = useState(null);
  const [startCursor, setStartCursor] = useState(null);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async (mode = "next", cursor = '') => {
    try {
      setLoading(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_APP_URL
        }/etsapp1/api/products?mode=${mode}&cursor=${cursor}`,
        { method: "GET" }
      );
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
        setHasNext(data.products.pageInfo.hasNextPage);
        setHasPrevious(data.products.pageInfo.hasPreviousPage);
        setEndCursor(data.products.pageInfo.endCursor);
        setStartCursor(data.products.pageInfo.startCursor);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resourceName = {
    singular: "product",
    plural: "products",
  };


  const renderProuduct = () => {
    if (products.hasOwnProperty("edges")) {
      const rowMarkup = products?.edges.map((edge, index) => {
        const renderCollections = (collections) => {
          if (collections) {
            return collections.edges.map((edge) => edge.node.title).join(",");
          }
          return "";
        };

        const renderTone = (status) => {
          let tone = {
            active: "success",
            draf: "critical",
            archived: "warning",
          };

          return tone[status.toLowerCase()];
        };

        const {
          id,
          images,
          title,
          status,
          productType,
          collections,
          totalInventory,
          vendor,
          onlineStorePreviewUrl,
        } = edge.node;

        return (
          <IndexTable.Row
            id={id}
            key={id}
            position={index}
          >
            <IndexTable.Cell>
              {images.edges[0] ? (
                <Thumbnail
                  size="small"
                  source={images.edges[0].node.url}
                  alt={images.edges[0].node.url}
                />
              ) : (
                <Icon source={ImageIcon} tone="base" />
              )}
            </IndexTable.Cell>
            <IndexTable.Cell>
              <Link
                monochrome
                url="https://help.shopify.com/manual"
                removeUnderline={true}
              >
                {title}
              </Link>
            </IndexTable.Cell>
            <IndexTable.Cell>
              <Link target="_blank" url={onlineStorePreviewUrl || ''}>
                <Icon source={ViewIcon} tone="base" />
              </Link>
            </IndexTable.Cell>
            <IndexTable.Cell>
              <Badge tone={renderTone(status)}>{status}</Badge>
            </IndexTable.Cell>
            <IndexTable.Cell>{totalInventory}</IndexTable.Cell>
            <IndexTable.Cell>{renderCollections(collections)}</IndexTable.Cell>
            <IndexTable.Cell>{productType}</IndexTable.Cell>
            <IndexTable.Cell>
              <Text as="span" alignment="end" numeric>
                {vendor}
              </Text>
            </IndexTable.Cell>
          </IndexTable.Row>
        );
      });

      return rowMarkup;
    }
  };

  return (
    <Page fullWidth>
      <LegacyCard>
        <IndexTable
          resourceName={resourceName}
          itemCount={products.edges ? products.edges.length : 0}

          headings={[
            {},
            { title: "Product", alignment: "start", colgroup: "2" },
            {},
            { title: "Status" },
            { title: "Inventory", alignment: "start" },
            { title: "Category" },
            { title: "Type", alignment: "center" },
            { title: "Vendor", alignment: "end" },
          ]}
          pagination={{
            hasPrevious: hasPrevious,
            onPrevious: () => {
              if (hasPrevious) {
                fetchProducts("pre", startCursor);
              }
            },
            hasNext: hasNext,
            onNext: () => {
              if (hasNext) {
                fetchProducts("next", endCursor);
              }
            },
          }}
        >
          {renderProuduct()}
        </IndexTable>
      </LegacyCard>
    </Page>
  );
}
