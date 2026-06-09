import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	const query =  db.schema
		.alterTable('category')
		.addColumn('parent_uuid', sql`binary(16)`)
		.compile()

	const query1 =  db.schema
		.alterTable('category')
		.addColumn('path', 'text')
		.compile()		

	const query2 = db.schema
	.alterTable('category')
	.addForeignKeyConstraint('parent_uuid_fk', ['parent_uuid'], 'category', ['uuid'])
	.compile()

	console.log(query)
	console.log(query1)
	console.log(query2)

	await db.executeQuery(query)
	await db.executeQuery(query1)
	await db.executeQuery(query2)
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('category')
		.dropConstraint('parent_uuid_fk')
		.execute()

	await db.schema
		.alterTable('category')
		.dropColumn('parent_uuid')
		.dropColumn('path')
		.execute()
}
