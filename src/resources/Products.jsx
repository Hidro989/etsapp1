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
  
  import { ViewIcon } from "@shopify/polaris-icons";
  
//   import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
  import { useEffect, useState } from "react";
  // import { useTranslation } from "react-i18next";
  
  export default function Products() {
    //   const { t } = useTranslation();
  
    // const shopify = useAppBridge();
    const [isPopulating, setIsPopulating] = useState(false);
    // const {
    //   data,
    //   refetch: refetchProducts,
    //   isLoading: isLoadingProducts,
    // } = useQuery({
    //   queryKey: ["products"],
    //   queryFn: async () => {
    //     const response = await fetch("/api/products");
    //     return await response.json();
    //   },
    //   refetchOnWindowFocus: false,
    // });
  
  
  
    // const setPopulating = (flag) => {
    //   shopify.loading(flag);
    //   setIsPopulating(flag);
    // };
  
    useEffect( () => {
      async function startFetching() {
        // setPopulating(true);
        const response = await fetch(`${import.meta.env.VITE_APP_URL}/etsapp1/api/products`, { method: "GET" });
        const data = response.json();
        console.log(data);
        
        // if (response.ok) {
    
        //   shopify.toast.show(
        //     "Get products successfully",{products: response.json()}
        //   );
    
        // } else {
        //   shopify.toast.show("Get failed product", {
        //     isError: true,
        //   });
        // }
    
        // setPopulating(false);
      }
  
      let ignore = false;
      startFetching();
      return () => {
        ignore = true;
      }
  
    }, []);
  
    const orders = [
      {
        id: "1020",
        order: "#1020",
        date: "Jul 20 at 4:34pm",
        customer: "Jaydon Stanton",
        total: "$969.44",
        paymentStatus: <Badge progress="complete">Paid</Badge>,
        fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
      },
      {
        id: "1019",
        order: "#1019",
        date: "Jul 20 at 3:46pm",
        customer: "Ruben Westerfelt",
        total: "$701.19",
        paymentStatus: <Badge progress="partiallyComplete">Partially paid</Badge>,
        fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
      },
      {
        id: "1018",
        order: "#1018",
        date: "Jul 20 at 3.44pm",
        customer: "Leo Carder",
        total: "$798.24",
        paymentStatus: <Badge progress="complete">Paid</Badge>,
        fulfillmentStatus: <Badge progress="incomplete">Unfulfilled</Badge>,
      },
    ];
    const resourceName = {
      singular: "order",
      plural: "orders",
    };
  
    const { selectedResources, allResourcesSelected, handleSelectionChange } =
      useIndexResourceState(orders);
  
    const rowMarkup = orders.map(
      (
        { id, order, date, customer, total, paymentStatus, fulfillmentStatus },
        index
      ) => (
        <IndexTable.Row
          id={id}
          key={id}
          selected={selectedResources.includes(id)}
          position={index}
        >
          <IndexTable.Cell>
            <Thumbnail
              size="small"
              source="https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
              alt="Black choker necklace"
            />
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Link
              monochrome
              url="https://help.shopify.com/manual"
              removeUnderline={true}
            >
              1 MINUTE READY TO WEAR SAREE , BELT WITH UNSTITCHED BLOUSE RED
            </Link>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Link target="_blank" url="https://help.shopify.com/manual">
              <Icon source={ViewIcon} tone="base"/>
            </Link>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {order}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{date}</IndexTable.Cell>
          <IndexTable.Cell>{customer}</IndexTable.Cell>
          <IndexTable.Cell>
            <Text as="span" alignment="end" numeric>
              {total}
            </Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{paymentStatus}</IndexTable.Cell>
          <IndexTable.Cell>{fulfillmentStatus}</IndexTable.Cell>
        </IndexTable.Row>
      )
    );
  
    return (
      <Page fullWidth>
        
        <LegacyCard>
          <IndexTable
            resourceName={resourceName}
            itemCount={orders.length}
            selectedItemsCount={
              allResourcesSelected ? "All" : selectedResources.length
            }
            onSelectionChange={handleSelectionChange}
            headings={[
              {},
              { title: "Product", alignment: "start", colgroup: "2" },
              {},
              { title: "Status" },
              { title: "Inventory", alignment: "start" },
              { title: "Sales channels", alignment: "end" },
              { title: "Markets" },
              { title: "B2B catalogs" },
              { title: "Category" },
              { title: "Type", alignment: "end" },
              { title: "Category", alignment: "start" },
            ]}
            pagination={{
              hasNext: true,
              onNext: () => {},
            }}
          >
            {rowMarkup}
          </IndexTable>
        </LegacyCard>
      </Page>
    );
  }
  