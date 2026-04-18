// EX1: Write an SQL query to generate a daily report of the total revenue for a specific date.
// We do this in two ways:
// 1. Pure SQL
// 2. Kysely Query builder

import { sql } from "kysely";
import { db } from "../database";
import dayjs from "dayjs";

const date = dayjs('2025-08-13')

async function rawSql() {
    // I'm hardcoding dates because I want to keep it pure SQL.
    const result = await sql`
    SELECT
        SUM(total_amount) as total_revenue
    FROM
        orders
    WHERE
        order_date >= '2025-08-13'
        AND
        order_date < '2025-08-14';
    `.execute(db)

    console.log(result)
}

async function queryBuilder() {
    // This is a middle ground between pure SQL and ORMs,
    // also it is type-safe => less mistakes.
    const result = await db.selectFrom('orders')
        .select((eb) => eb.fn.sum('total_amount').as('total_revenue'))
        .where('order_date', '>=', date.startOf('day').toDate())
        .where('order_date', '<', date.endOf('day').toDate())
        .execute()

    console.log(result)
}

rawSql()
queryBuilder()