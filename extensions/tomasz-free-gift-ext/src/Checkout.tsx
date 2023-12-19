import {
  Banner,
  useApi,
  useTranslate,
  reactExtension,
  useSubtotalAmount,
  useSettings,
  useApplyCartLinesChange,
  useCartLines,
  Text
} from '@shopify/ui-extensions-react/checkout';
import { useEffect, useState } from 'react';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

interface giftPrice {
  priceV2: {
    amount: number
  }
  product: {
    title: string
  }
}

function Extension() {
  // const translate = useTranslate();
  const { query } = useApi();

  const total = useSubtotalAmount();
  const applyCartLinesChange = useApplyCartLinesChange()
  const cartLines = useCartLines()

  const defaultGift = "gid://shopify/ProductVariant/45204979515694"
  const defaultMinTotal = 625

  let giftId: string
  let minTotal: number;

  const settings = useSettings()

  giftId = settings.gift_variant as string
  minTotal = settings.min_cart_total as number

  if (!giftId) {
    giftId = defaultGift
  }

  if (!minTotal) {
    minTotal = defaultMinTotal
  }

  const [isGiftAdded, setIsGiftAdded] = useState<boolean>(false)
  const [giftPrice, setGiftPrice] = useState<number>(0)
  const [productTitle, setProductTitle] = useState<string>("")

  useEffect(() => {
    async function getGiftPrice() {
      const queryResult = await query<{node: giftPrice}>(`{
            node(id: "${giftId}"){
              ... on ProductVariant {
                title
                priceV2 {
                  amount
                }
                product {
                  title
                }
              }
            }
          }`
      )

      if (queryResult) {
        setGiftPrice(queryResult.data.node.priceV2.amount)
        setProductTitle(queryResult.data.node.product.title)
      }
  }
  getGiftPrice()
  }, [giftPrice])

  useEffect(() => {
    if(productTitle == '' || giftPrice == 0) {
      return
    }

    console.log("total.amount", total.amount)
    console.log("giftPrice", giftPrice)

    if (total.amount >= minTotal && isGiftAdded === false) {
      applyCartLinesChange({
        type: 'addCartLine',
        merchandiseId: giftId,
        quantity: 1,
      })

      setIsGiftAdded(true)

    } else if (total.amount - giftPrice < minTotal && isGiftAdded === true) {
      const cartLineId = cartLines.find((cartLine) => cartLine.merchandise.id === giftId)?.id

      if (cartLineId) {
        applyCartLinesChange({
          type: 'removeCartLine',
          id: cartLineId,
          quantity: 1,
        })
      }

      setIsGiftAdded(false)

    }
  }, [total.amount])

  return (
    productTitle &&
    <Banner title="FREE GIFT">
      <Text>Spend more then {minTotal} {total.currencyCode} and get free {productTitle}!</Text>
    </Banner>
  );
}