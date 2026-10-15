export type ProductCopy = {
  headline: string;
  offer: string;
  price: string;
  oldPrice: string;
  cta: string;
};
export type Product = { name: string; image: string; copy: ProductCopy };

// Placeholder product photos from Unsplash. Plainly downloads them while
// rendering, so they must be public URLs
const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=1080&q=80`;

export const products = {
  sneakers: {
    name: "Sneakers",
    image: unsplash("photo-1542291026-7eec264c27ff"),
    copy: {
      headline: "Run further. Recover faster.",
      offer: "20% OFF",
      price: "$79",
      oldPrice: "$99",
      cta: "Shop now",
    },
  },
  headphones: {
    name: "Headphones",
    image: unsplash("photo-1505740420928-5e560c06d30e"),
    copy: {
      headline: "Silence the noise.",
      offer: "NEW",
      price: "$129",
      oldPrice: "",
      cta: "Listen now",
    },
  },
  coffee: {
    name: "Coffee",
    image: unsplash("photo-1509042239860-f550ce710b93"),
    copy: {
      headline: "Your morning, upgraded.",
      offer: "2 FOR 1",
      price: "$12",
      oldPrice: "$24",
      cta: "Order now",
    },
  },
  watch: {
    name: "Watch",
    image: unsplash("photo-1523275335684-37898b6baf30"),
    copy: {
      headline: "Time well spent.",
      offer: "FREE SHIPPING",
      price: "$199",
      oldPrice: "",
      cta: "Buy now",
    },
  },
} satisfies Record<string, Product>;

export type ProductId = keyof typeof products;

export const isProductId = (id: unknown): id is ProductId =>
  typeof id === "string" && Object.hasOwn(products, id);

export const productIds = Object.keys(products).filter(isProductId);

// Renders only store the image URL, this finds the product again
export const productIdOf = (image: unknown) =>
  productIds.find((id) => products[id].image === image);
