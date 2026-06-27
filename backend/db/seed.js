const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'luckykidies.db'));

// Create tables
const schema = require('fs').readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Insert categories
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, slug, tag, icon)
  VALUES (@name, @slug, @tag, @icon)
`);

const categories = [
  { name: "Children's Wears", slug: 'childrens-thrift', tag: 'THRIFT', icon: 'ti-shirt' },
  { name: "Children's Wears", slug: 'childrens-new', tag: 'NEW', icon: 'ti-shirt' },
  { name: 'School Bags', slug: 'school-bags', tag: null, icon: 'ti-backpack' },
  { name: 'Water Bottles', slug: 'water-bottles', tag: null, icon: 'ti-bottle' },
  { name: "Children's Shoes", slug: 'childrens-shoes', tag: null, icon: 'ti-shoe' },
  { name: "Adults' Shoes", slug: 'adults-shoes', tag: null, icon: 'ti-shoe' },
  { name: "Ladies' Wears", slug: 'ladies-thrift', tag: 'THRIFT', icon: 'ti-dress' },
  { name: "Ladies' Wears", slug: 'ladies-new', tag: 'NEW', icon: 'ti-dress' },
  { name: "Men's Wears", slug: 'mens-thrift', tag: 'THRIFT', icon: 'ti-shirt' },
  { name: 'Underwears', slug: 'underwears', tag: null, icon: 'ti-underwear' },
];

const insertMany = db.transaction((cats) => {
  for (const cat of cats) insertCategory.run(cat);
});
insertMany(categories);

// Insert sample products
const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (name, description, price, image_url, category_id, stock, condition)
  VALUES (@name, @description, @price, @image_url, @category_id, @stock, @condition)
`);

const products = [
  // Children's Thrift (category_id: 1)
  { name: 'Kids Polo Shirt', description: 'Gently used polo shirt for boys aged 3-5', price: 800, image_url: 'https://placehold.co/400x400?text=Kids+Polo', category_id: 1, stock: 15, condition: 'thrift' },
  { name: 'Girls Gown Set', description: 'Colourful gown set for girls aged 4-6', price: 1200, image_url: 'https://placehold.co/400x400?text=Girls+Gown', category_id: 1, stock: 10, condition: 'thrift' },
  { name: 'Boys Shorts & Top', description: 'Comfortable shorts and top combo, ages 2-4', price: 950, image_url: 'https://placehold.co/400x400?text=Boys+Set', category_id: 1, stock: 8, condition: 'thrift' },

  // Children's New (category_id: 2)
  { name: 'New Baby Onesie', description: 'Brand new cotton onesie for babies 0-12 months', price: 2500, image_url: 'https://placehold.co/400x400?text=Baby+Onesie', category_id: 2, stock: 20, condition: 'new' },
  { name: 'New Kids Joggers', description: 'Trendy jogger pants for kids aged 5-8', price: 3200, image_url: 'https://placehold.co/400x400?text=Kids+Joggers', category_id: 2, stock: 12, condition: 'new' },

  // School Bags (category_id: 3)
  { name: 'Cartoon School Bag', description: 'Spacious school bag with cartoon prints', price: 4500, image_url: 'https://placehold.co/400x400?text=School+Bag', category_id: 3, stock: 18, condition: 'new' },
  { name: 'Mini Backpack', description: 'Lightweight backpack for nursery/primary school', price: 3000, image_url: 'https://placehold.co/400x400?text=Mini+Bag', category_id: 3, stock: 14, condition: 'new' },

  // Water Bottles (category_id: 4)
  { name: 'Spill-proof Bottle', description: 'Colourful 500ml spill-proof water bottle', price: 1500, image_url: 'https://placehold.co/400x400?text=Water+Bottle', category_id: 4, stock: 25, condition: 'new' },
  { name: 'Thermos Kids Bottle', description: 'Keeps water cold for 8 hours', price: 2200, image_url: 'https://placehold.co/400x400?text=Thermos', category_id: 4, stock: 10, condition: 'new' },

  // Children's Shoes (category_id: 5)
  { name: 'Kids Canvas Shoes', description: 'Durable canvas shoes sizes 25-32', price: 3500, image_url: 'https://placehold.co/400x400?text=Kids+Shoes', category_id: 5, stock: 20, condition: 'new' },
  { name: 'School Sandals', description: 'Black school sandals sizes 28-35', price: 2800, image_url: 'https://placehold.co/400x400?text=Sandals', category_id: 5, stock: 15, condition: 'new' },

  // Adults' Shoes (category_id: 6)
  { name: "Men's Loafers", description: 'Classic loafers sizes 40-45', price: 8500, image_url: 'https://placehold.co/400x400?text=Loafers', category_id: 6, stock: 10, condition: 'new' },
  { name: "Ladies' Heels", description: 'Elegant block heels sizes 36-42', price: 7000, image_url: 'https://placehold.co/400x400?text=Heels', category_id: 6, stock: 8, condition: 'new' },

  // Ladies' Thrift (category_id: 7)
  { name: 'Thrift Ankara Blouse', description: 'Beautiful ankara blouse, sizes M-XL', price: 1500, image_url: 'https://placehold.co/400x400?text=Ankara+Blouse', category_id: 7, stock: 6, condition: 'thrift' },
  { name: 'Thrift Gown', description: 'Elegant evening gown, size L', price: 2000, image_url: 'https://placehold.co/400x400?text=Thrift+Gown', category_id: 7, stock: 4, condition: 'thrift' },

  // Ladies' New (category_id: 8)
  { name: 'New Bodycon Dress', description: 'Trendy bodycon dress sizes S-XL', price: 6500, image_url: 'https://placehold.co/400x400?text=Bodycon', category_id: 8, stock: 12, condition: 'new' },
  { name: 'New Palazzo Pants', description: 'Flowy palazzo pants, all sizes', price: 4800, image_url: 'https://placehold.co/400x400?text=Palazzo', category_id: 8, stock: 10, condition: 'new' },

  // Men's Thrift (category_id: 9)
  { name: 'Thrift Native Agbada', description: 'Classic agbada set, size XL', price: 3500, image_url: 'https://placehold.co/400x400?text=Agbada', category_id: 9, stock: 3, condition: 'thrift' },
  { name: 'Thrift Chinos + Shirt', description: 'Chinos and shirt combo, size M', price: 2500, image_url: 'https://placehold.co/400x400?text=Chinos', category_id: 9, stock: 5, condition: 'thrift' },

  // Underwears (category_id: 10)
  { name: "Children's Underpants Pack", description: 'Pack of 5, sizes 2-8 years', price: 1800, image_url: 'https://placehold.co/400x400?text=Kids+Underpants', category_id: 10, stock: 30, condition: 'new' },
  { name: "Ladies' Bra Set", description: 'Comfortable bra and panty set, sizes 32-38', price: 2500, image_url: 'https://placehold.co/400x400?text=Bra+Set', category_id: 10, stock: 20, condition: 'new' },
];

const insertProducts = db.transaction((prods) => {
  for (const p of prods) insertProduct.run(p);
});
insertProducts(products);

console.log('✅ Database seeded successfully!');
console.log(`   ${categories.length} categories inserted`);
console.log(`   ${products.length} products inserted`);

db.close();