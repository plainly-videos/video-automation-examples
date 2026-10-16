export const categories = { tech: "Tech", clothes: "Clothes" };
export type Category = keyof typeof categories;

export type Product = {
  name: string;
  price: string;
  image: string;
  category: Category;
};

// Placeholder product photos from Unsplash. Plainly downloads them while
// rendering, so they must be public URLs
const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?w=1080&q=80`;

export const products = {
  headphones: {
    name: "Wireless headphones",
    category: "tech",
    price: "$129",
    image: unsplash("photo-1505740420928-5e560c06d30e"),
  },
  speaker: {
    name: "Bluetooth speaker",
    category: "tech",
    price: "$89",
    image: unsplash("photo-1608043152269-423dbba4e7e1"),
  },
  smartwatch: {
    name: "Smartwatch",
    category: "tech",
    price: "$249",
    image: unsplash("photo-1546868871-7041f2a55e12"),
  },
  camera: {
    name: "Instant camera",
    category: "tech",
    price: "$99",
    image: unsplash("photo-1526170375885-4d8ecf77b99f"),
  },
  keyboard: {
    name: "Slim keyboard",
    category: "tech",
    price: "$99",
    image: unsplash("photo-1587829741301-dc798b83add3"),
  },
  mouse: {
    name: "Wireless mouse",
    category: "tech",
    price: "$39",
    image: unsplash("photo-1527864550417-7fd91fc51a46"),
  },
  jacket: {
    name: "Leather jacket",
    category: "clothes",
    price: "$189",
    image: unsplash("photo-1551028719-00167b16eac5"),
  },
  tshirt: {
    name: "Cotton T-shirt",
    category: "clothes",
    price: "$25",
    image: unsplash("photo-1521572163474-6864f9cf17ab"),
  },
  hoodie: {
    name: "Grey hoodie",
    category: "clothes",
    price: "$55",
    image: unsplash("photo-1556821840-3a63f95609a7"),
  },
  sneakers: {
    name: "Running sneakers",
    category: "clothes",
    price: "$79",
    image: unsplash("photo-1542291026-7eec264c27ff"),
  },
} satisfies Record<string, Product>;

export type ProductId = keyof typeof products;

export const isProductId = (id: unknown): id is ProductId =>
  typeof id === "string" && Object.hasOwn(products, id);

export const productIds = Object.keys(products).filter(isProductId);

// Renders only store the image URL, this finds the product again
export const productIdOf = (image: unknown) =>
  productIds.find((id) => products[id].image === image);

// An ad shows three products of one category, so they read as one collection
export const productsIn = (category: Category) =>
  productIds.filter((id) => products[id].category === category);
