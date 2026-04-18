// EX2: Write an SQL query to generate a monthly report of the top-selling products in a given month
// We do this in two ways:
// 1. Pure SQL
// 2. Kysely Query builder

import { sql } from "kysely";
import { db } from "../database";
import dayjs from "dayjs";

const month = dayjs('2026-04').startOf('month')

async function rawSql() {
    // I'm hardcoding dates because I want to keep it pure SQL.
    const result = await sql`
        SELECT product.uuid, product.name, SUM(order_details.quantity) as total_units_sold
        FROM order_details
        JOIN product ON order_details.product_uuid = product.uuid
        JOIN orders ON order_details.order_uuid = orders.uuid
        WHERE
            orders.order_date >= '2025-08-01'
            AND
            orders.order_date < '2025-09-01'
        GROUP BY
            product.uuid,
            product.name
        ORDER BY
            total_units_sold DESC;
    `.execute(db)

    console.log(result)
}

async function queryBuilder() {
    // This is a middle ground between pure SQL and ORMs,
    // also it is type-safe => less mistakes.
    const result = await db
    .selectFrom('order_details')
    .innerJoin('product', 'order_details.product_uuid', 'product.uuid')
    .innerJoin('orders', 'order_details.order_uuid', 'orders.uuid')
    .select([
    'product.uuid',
    'product.name',
    db.fn.sum<number>('order_details.quantity').as('total_units_sold')
    ])
    .where('orders.order_date', '>=', month.toDate())
    .where('orders.order_date', '<', month.add(1, 'month').toDate())
    .groupBy(['product.uuid', 'product.name'])
    .orderBy('total_units_sold', 'desc')
    .execute();
    console.log(result)
}

rawSql()
queryBuilder()