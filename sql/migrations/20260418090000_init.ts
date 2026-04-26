import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('category')
    .addColumn('uuid', sql`BINARY(16)`, (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('customer')
    .addColumn('uuid', sql`BINARY(16)`, (col) => col.primaryKey())
    .addColumn('first_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('last_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('product')
    .addColumn('uuid', sql`BINARY(16)`, (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('price', 'decimal(10, 2)', (col) => col.notNull())
    .addColumn('stock_quantity', 'integer', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('category_uuid', sql`BINARY(16)`, (col) =>
      col
        .notNull()
        .references('category.uuid')
        .onDelete('restrict')
        .onUpdate('cascade'),
    )
    .execute();

  await db.schema
    .createTable('orders')
    .addColumn('uuid', sql`BINARY(16)`, (col) => col.primaryKey())
    .addColumn('order_date', 'timestamp', (col) => col.notNull())
    .addColumn('total_amount', 'decimal(10, 2)', (col) => col.notNull())
    .addColumn('customer_uuid', sql`BINARY(16)`, (col) =>
      col
        .notNull()
        .references('customer.uuid')
        .onDelete('restrict')
        .onUpdate('cascade'),
    )
    .execute();

  await db.schema
    .createTable('order_details')
    .addColumn('uuid', sql`BINARY(16)`, (col) => col.primaryKey())
    .addColumn('quantity', 'integer', (col) => col.notNull())
    .addColumn('unit_price', 'decimal(10, 2)', (col) => col.notNull())
    .addColumn('order_uuid', sql`BINARY(16)`, (col) =>
      col
        .notNull()
        .references('orders.uuid')
        .onDelete('restrict')
        .onUpdate('cascade'),
    )
    .addColumn('product_uuid', sql`BINARY(16)`, (col) =>
      col
        .notNull()
        .references('product.uuid')
        .onDelete('restrict')
        .onUpdate('cascade'),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('order_details').ifExists().execute();
  await db.schema.dropTable('orders').ifExists().execute();
  await db.schema.dropTable('product').ifExists().execute();
  await db.schema.dropTable('customer').ifExists().execute();
  await db.schema.dropTable('category').ifExists().execute();
}
