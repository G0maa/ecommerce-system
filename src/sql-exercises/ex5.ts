// EX5: Recommend products that were not purchased by customer in a specific category
// INPUT: CustomerUuid, CategoryUuid
// OUTPUT: Popular products in that category that were not purchased by customer.
// 1. Pure SQL
// 2. Kysely Query builder

import { sql } from "kysely";
import { db } from "../database";

const customerUuid = '0x00003E4A59A1467EA0DB8A29B9167F6C'
const categoryUuid = '0x138C41CB5AA84A86827E067A27114E29'

async function rawSql() {
    const result = await sql`
        SELECT product.uuid, product.name, product.description, category.uuid as category_uuid, category.name as category_name, SUM(order_details.quantity) as purchase_count
        FROM product
        JOIN category
        ON product.category_uuid = category.uuid
        JOIN order_details
        ON order_details.product_uuid = product.uuid
        WHERE product.uuid NOT IN(
            SELECT product.uuid
            FROM order_details
            JOIN orders
            ON orders.uuid = order_details.order_uuid
            JOIN customer
            ON customer.uuid = orders.customer_uuid
            WHERE customer.uuid = '0x00003E4A59A1467EA0DB8A29B9167F6C'
            AND product.category_uuid = '0x138C41CB5AA84A86827E067A27114E29'
        )
            AND
                category.uuid = '0x138C41CB5AA84A86827E067A27114E29'
        GROUP BY
        product.uuid, category.uuid
        ORDER BY
        purchase_count DESC;
    `
    .execute(db)

    console.log(result)
}

async function queryBuilder() {
    // This is a middle ground between pure SQL and ORMs,
    // also it is type-safe => less mistakes.
    const result = await db
    .selectFrom('product')
    .innerJoin('category', 'product.category_uuid', 'category.uuid')
    .innerJoin('order_details', 'order_details.product_uuid', 'product.uuid')
    .select([
        'product.uuid',
        'product.name',
        'product.description',
        'category.uuid as category_uuid',
        'category.name as category_name',
        sql<number>`SUM(order_details.quantity)`.as('purchase_count'),
    ])
    .where('category.uuid', '=', Buffer.from(categoryUuid))
    .where('product.uuid', 'not in', (eb) =>
        eb
        .selectFrom('order_details')
        .innerJoin('orders', 'orders.uuid', 'order_details.order_uuid')
        .select('order_details.product_uuid')
        .where('orders.customer_uuid', '=', Buffer.from(customerUuid))
        .where('product.category_uuid', '=', Buffer.from(categoryUuid))
    )
    .groupBy([
        'product.uuid',
        'product.name',
        'product.description',
        'category.uuid',
        'category.name',
    ])
    .orderBy('purchase_count', 'desc')
    .execute()
    
    console.log(result)
}

rawSql()
queryBuilder()