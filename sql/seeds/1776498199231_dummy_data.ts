import { randomUUID } from 'node:crypto';
import { faker } from '@faker-js/faker';
import { sql, type Insertable, type Kysely } from 'kysely';
import type {
  CategoryTable,
  CustomerTable,
  Database,
  OrderDetailsTable,
  OrdersTable,
  ProductTable,
} from '../../src/types.js';

// ---------------------------------------------------------------------------
// Scale knobs — override via env. Defaults are modest; crank them up locally.
// Total rows ≈ CATEGORIES + CUSTOMERS + PRODUCTS + ORDERS * (1 + avg details).
// ---------------------------------------------------------------------------
const NUM_CATEGORIES = Number(process.env.SEED_CATEGORIES ?? 50);
const NUM_CUSTOMERS = Number(process.env.SEED_CUSTOMERS ?? 10_000);
const NUM_PRODUCTS = Number(process.env.SEED_PRODUCTS ?? 5_000);
const NUM_ORDERS = Number(process.env.SEED_ORDERS ?? 100_000);
const MAX_DETAILS_PER_ORDER = Number(process.env.SEED_MAX_DETAILS ?? 5);
const SEED = Number(process.env.SEED_RANDOM ?? 42);
const BATCH_SIZE = Number(process.env.SEED_BATCH ?? 1_000);

/** Convert a UUID string (with or without dashes) to a BINARY(16) Buffer. */
function uuidToBuf(uuid: string = randomUUID()): Buffer {
  return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

/** Insert an array in chunks; keeps packet size and placeholder count sane. */
async function insertInBatches<TName extends keyof Database>(
  db: Kysely<Database>,
  table: TName,
  rows: ReadonlyArray<Insertable<Database[TName]>>,
  batchSize = BATCH_SIZE,
): Promise<void> {
  const started = Date.now();
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    await db.insertInto(table).values(chunk as never).execute();
    if ((i / batchSize) % 25 === 0) {
      console.log(
        `  · ${table}: ${Math.min(i + batchSize, rows.length).toLocaleString()}/${rows.length.toLocaleString()}`,
      );
    }
  }
  console.log(
    `  ✓ ${table}: ${rows.length.toLocaleString()} rows in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

/** Pick a random element from an array (faster than faker.helpers.arrayElement for hot loops). */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export async function seed(db: Kysely<Database>): Promise<void> {
  faker.seed(SEED);
  // Math.random is used in `pick()`; seed it indirectly by also seeding faker
  // for deterministic faker-generated values.

  console.log('→ Wiping existing data...');
  // Disable FK checks so TRUNCATE (much faster than DELETE) works across FKs.
  await sql`SET FOREIGN_KEY_CHECKS = 0`.execute(db);
  for (const table of ['order_details', 'orders', 'product', 'customer', 'category'] as const) {
    await sql`TRUNCATE TABLE ${sql.ref(table)}`.execute(db);
  }
  await sql`SET FOREIGN_KEY_CHECKS = 1`.execute(db);

  // --- Categories -----------------------------------------------------------
  console.log(`→ Generating ${NUM_CATEGORIES.toLocaleString()} categories...`);
  const categoryIds: Buffer[] = [];
  const categories: Insertable<CategoryTable>[] = Array.from({ length: NUM_CATEGORIES }, () => {
    const uuid = uuidToBuf();
    categoryIds.push(uuid);
    return { uuid, name: faker.commerce.department() + ' ' + faker.string.alphanumeric(4) };
  });
  await insertInBatches(db, 'category', categories);

  // --- Customers ------------------------------------------------------------
  console.log(`→ Generating ${NUM_CUSTOMERS.toLocaleString()} customers...`);
  const customerIds: Buffer[] = [];
  const customers: Insertable<CustomerTable>[] = Array.from({ length: NUM_CUSTOMERS }, (_, i) => {
    const uuid = uuidToBuf();
    customerIds.push(uuid);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    return {
      uuid,
      first_name: firstName,
      last_name: lastName,
      // Email must be unique — suffix with the row index to avoid collisions at scale.
      email: `${faker.internet.username({ firstName, lastName }).toLowerCase()}.${i}@example.com`,
      password_hash: faker.string.hexadecimal({ length: 60, prefix: '$2b$10$' }),
    };
  });
  await insertInBatches(db, 'customer', customers);

  // --- Products -------------------------------------------------------------
  console.log(`→ Generating ${NUM_PRODUCTS.toLocaleString()} products...`);
  const productIds: Buffer[] = [];
  const productPrices: number[] = [];
  const products: Insertable<ProductTable>[] = Array.from({ length: NUM_PRODUCTS }, () => {
    const uuid = uuidToBuf();
    const price = Number(faker.commerce.price({ min: 1, max: 5000, dec: 2 }));
    productIds.push(uuid);
    productPrices.push(price);
    return {
      uuid,
      name: faker.commerce.productName(),
      price,
      stock_quantity: faker.number.int({ min: 0, max: 1000 }),
      description: faker.datatype.boolean(0.8) ? faker.commerce.productDescription() : null,
      category_uuid: pick(categoryIds),
    };
  });
  await insertInBatches(db, 'product', products);

  // --- Orders + details -----------------------------------------------------
  console.log(
    `→ Generating ${NUM_ORDERS.toLocaleString()} orders + details (avg ${
      (MAX_DETAILS_PER_ORDER + 1) / 2
    } per order)...`,
  );
  const orders: Insertable<OrdersTable>[] = new Array(NUM_ORDERS);
  const orderDetails: Insertable<OrderDetailsTable>[] = [];

  for (let i = 0; i < NUM_ORDERS; i++) {
    const orderId = uuidToBuf();
    const detailCount = faker.number.int({ min: 1, max: MAX_DETAILS_PER_ORDER });
    let total = 0;

    for (let j = 0; j < detailCount; j++) {
      const productIdx = Math.floor(Math.random() * productIds.length);
      const qty = faker.number.int({ min: 1, max: 10 });
      const unitPrice = productPrices[productIdx]!;
      total += qty * unitPrice;
      orderDetails.push({
        uuid: uuidToBuf(),
        quantity: qty,
        unit_price: unitPrice,
        order_uuid: orderId,
        product_uuid: productIds[productIdx]!,
      });
    }

    orders[i] = {
      uuid: orderId,
      order_date: faker.date.past({ years: 2 }),
      total_amount: Number(total.toFixed(2)),
      customer_uuid: pick(customerIds),
    };
  }

  await insertInBatches(db, 'orders', orders);
  await insertInBatches(db, 'order_details', orderDetails);

  console.log(
    `✔ Done. Inserted ${(
      NUM_CATEGORIES + NUM_CUSTOMERS + NUM_PRODUCTS + NUM_ORDERS + orderDetails.length
    ).toLocaleString()} rows total.`,
  );
}
