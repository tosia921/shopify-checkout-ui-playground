import {
  useApi,
  useTranslate,
  reactExtension,
  BlockStack,
  Checkbox,
  InlineLayout,
  Image,
  Text,
  Pressable,
  Heading,
  BlockSpacer,
  Divider,
  useCartLines,
  useSettings,
  useApplyCartLinesChange
} from '@shopify/ui-extensions-react/checkout';

import { useEffect, useState } from 'react';

export default reactExtension(
  'purchase.checkout.cart-line-list.render-after',
  () => <Extension />,
);

interface VariantData {
  title: string
  priceV2: {
    amount: string
    currencyCode: string
  }
  product: {
    title: string
    featuredImage: {
      altText: string
      id: string
      originalSrc: string
    }
  }
  image: {
    originalSrc: string
    altText: string
  }
}

function Extension() {
  const translate = useTranslate();
  const { query } = useApi();

  const [variantData, setVariantData] = useState<null | VariantData>(null)
  const [isSelected, setIsSelected] = useState(false)

  const cartLines = useCartLines()
  const applyCartLinesChange = useApplyCartLinesChange()

  const settings = useSettings()

  let variantID;

  variantID = settings.selected_variant as string
  const variantIDDefault = "gid://shopify/ProductVariant/45204979188014"

  if (!variantID) {
    variantID = variantIDDefault
  }

  const title = settings.upsell_title as string

  useEffect(() => {
    async function getVariantData() {
        const queryResult = await query<{node: VariantData}>(`{
              node(id: "${variantID}"){
                ... on ProductVariant {
                  title
                  priceV2 {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    featuredImage {
                      altText
                      id
                      originalSrc
                    }
                  }
                  image {
                    originalSrc
                    altText
                  }
                }
              }
            }`
        )

        if (queryResult) {
          setVariantData(queryResult.data.node)
        }

    }

    getVariantData()
  }, [])

  useEffect(() => {
    if (isSelected) {
      applyCartLinesChange({
        type: 'addCartLine',
        merchandiseId: variantID,
        quantity: 1,
      })
    } else {
      const cartLineId = cartLines.find((cartLine) => cartLine.merchandise.id === variantID)?.id

      if (cartLineId) {
        applyCartLinesChange({
          type: 'removeCartLine',
          id: cartLineId,
          quantity: 1,
        })
      }
    }

  }, [isSelected])


  if (!variantID || !variantData) {
    return null
  }
  return (
    <>
      <Divider />
      <BlockSpacer spacing={"base"}/>
      <Heading level={2}>{ title ? title : ''}</Heading>
      <BlockSpacer spacing={"base"}/>
      <Pressable onPress={() => setIsSelected(!isSelected)}>
        <InlineLayout
          blockAlignment={"center"}
          spacing={["base", "base"]}
          columns={["auto", 80, "fill"]}
          padding={"base"}
        >
          <Checkbox checked={isSelected} />
          <Image
            source={variantData.image.originalSrc || variantData.product.featuredImage.originalSrc }
            accessibilityDescription={variantData.image.altText || variantData.product.featuredImage.altText}
            border={"base"}
            borderRadius={"base"}
            borderWidth={"base"}
          />
          <BlockStack spacing="none">
            <Text>
              {variantData.product.title}
            </Text>
            <Text size={'small'}>
              - {variantData.title}
            </Text>
            <BlockSpacer spacing={"tight"}/>
            <Text>
              {variantData.priceV2.amount} {variantData.priceV2.currencyCode}
            </Text>
          </BlockStack>
        </InlineLayout>
      </Pressable>
    </>
  );
}