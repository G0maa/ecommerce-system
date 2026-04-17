import type { ColumnType } from 'kysely';

// BINARY(16) values are represented as Buffers by mysql2.
export type UUID = Buffer;

export interface CategoryTable {
  uuid: UUID;
  name: string;
}

export interface CustomerTable {
  uuid: UUID;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
}

export interface ProductTable {
  uuid: UUID;
  name: string;
  price: ColumnType<string, string | number, string | number>;
  stock_quantity: number;
  description: string | null;
  category_uuid: UUID;
}

export interface OrdersTable {
  uuid: UUID;
  order_date: ColumnType<Date, Date | string, Date | string>;
  total_amount: ColumnType<string, string | number, string | number>;
  customer_uuid: UUID;
}

export interface OrderDetailsTable {
  uuid: UUID;
  quantity: number;
  unit_price: ColumnType<string, string | number, string | number>;
  order_uuid: UUID;
  product_uuid: UUID;
}

export interface Database {
  category: CategoryTable;
  customer: CustomerTable;
  product: ProductTable;
  orders: OrdersTable;
  order_details: OrderDetailsTable;
}
