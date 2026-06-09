// EX4: Write a SQL query to search for all products with the word "camera" in either the product name or description.
// 1. Pure SQL
// 2. Kysely Query builder

import { sql } from "kysely";
import { db } from "../database";

async function rawSql() {
    // I'm hardcoding dates because I want to keep it pure SQL.
    const result = await sql`
        SELECT product.uuid, product.name, product.description
        FROM product
        WHERE MATCH (name, description)
        AGAINST ('computer')
        LIMIT 5;
    `
    .execute(db)

    console.log(result)
}

async function queryBuilder() {
    // This is a middle ground between pure SQL and ORMs,
    // also it is type-safe => less mistakes.
    const result = await db.selectFrom('product')
    .select(['product.uuid','product.name', 'product.description'])
    .where(() => sql`MATCH (name, description) AGAINST ('computer')`)
    .limit(5)
    .execute()
    
    console.log(result)
}

rawSql()
queryBuilder()