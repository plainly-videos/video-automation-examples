export type Product = { name: string; price: string; image: string };

// Placeholder product photos from Unsplash. Plainly downloads them while
// rendering, so they must be public URLs
const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=1080&q=80`;

export const products = {
  sneakers: {
    name: "Running sneakers",
    price: "$79",
    image: unsplash("photo-1542291026-7eec264c27ff"),
  },
  headphones: {
    name: "Wireless headphones",
    price: "$129",
    image: unsplash("photo-1505740420928-5e560c06d30e"),
  },
  coffee: {
    name: "Coffee beans",
    price: "$12",
    image: unsplash("photo-1509042239860-f550ce710b93"),
  },
  watch: {
    name: "Classic watch",
    price: "$199",
    image: unsplash("photo-1523275335684-37898b6baf30"),
  },
} satisfies Record<string, Product>;

export type ProductId = keyof typeof products;

export const isProductId = (id: unknown): id is ProductId =>
  typeof id === "string" && Object.hasOwn(products, id);

export const productIds = Object.keys(products).filter(isProductId);

// Renders only store the image URL, this finds the product again
export const productIdOf = (image: unknown) =>
  productIds.find((id) => products[id].image === image);
