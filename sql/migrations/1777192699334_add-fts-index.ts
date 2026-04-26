import { sql, type Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await sql
	`
	ALTER TABLE product
	ADD FULLTEXT INDEX products_poor_mans_fts_idx (name, description)
	`
	.execute(db)
}

export async function down(db: Kysely<any>): Promise<void> {
	await sql
	`
	ALTER TABLE product
    DROP INDEX products_poor_mans_fts_idx
	`
	.execute(db)
}
