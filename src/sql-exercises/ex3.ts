// EX3: Write a SQL query to retrieve a list of customers who have placed orders totaling more than $500 in the past month.
//  Include customer names and their total order amounts. [Complex query].
// We do this in two ways:
// 1. Pure SQL
// 2. Kysely Query builder

import { sql } from "kysely";
import { db } from "../database";
import dayjs from "dayjs";

const month = dayjs().subtract(1, 'month').startOf('month')

async function rawSql() {
    // I'm hardcoding dates because I want to keep it pure SQL.
    const result = await sql`
        SELECT
            customer.uuid,
            customer.first_name,
            customer.last_name,
            SUM(orders.total_amount) as total_amount_per_customer
        FROM
            customer
        JOIN
            orders
        ON
            customer.uuid = orders.customer_uuid
        WHERE
            orders.order_date >= '2026-03-01'
            AND
            orders.order_date < '2026-04-01'
        GROUP BY
            customer.uuid,
            customer.first_name,
            customer.last_name
        HAVING
            total_amount_per_customer > 500
        ORDER BY
            total_amount_per_customer DESC
        LIMIT 10;
    `.execute(db)

    console.log(result)
}

async function queryBuilder() {
    // This is a middle ground between pure SQL and ORMs,
    // also it is type-safe => less mistakes.
    const result = await db
    .selectFrom('customer')
    .innerJoin('orders', 'customer.uuid', 'orders.customer_uuid')
    .select((eb) => [
        'customer.uuid',
        'customer.first_name',
        'customer.last_name',
        eb.fn.sum('orders.total_amount').as('total_amount_per_customer')
    ])
    .where('orders.order_date', '>=', month.toDate())
    .where('orders.order_date', '<', month.add(1,'month').toDate())
    .groupBy([
        'customer.uuid',
    ])
    .having((eb) => eb.fn.sum('orders.total_amount'), '>', 500)
    .orderBy((eb) => eb.fn.sum('orders.total_amount'), 'desc')
    .limit(10)
    .execute()

    console.log(result)
}

rawSql()
queryBuilder()