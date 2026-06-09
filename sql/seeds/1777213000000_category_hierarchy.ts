import { sql, type Kysely } from 'kysely';
import type { Database } from '../../src/types.js';

/**
 * Convert a BINARY(16) buffer to a hex UUID string (no dashes) for display / path building.
 */
function bufToHex(buf: Buffer): string {
  return buf.toString('hex');
}

export async function seed(db: Kysely<Database>): Promise<void> {
  console.log('→ Fetching existing categories...');

  const categories = await db
    .selectFrom('category')
    .select(['uuid', 'name'])
    .execute();

  if (categories.length === 0) {
    console.log('  ⚠ No categories found — skipping hierarchy seed.');
    return;
  }

  console.log(`  Found ${categories.length} categories. Building hierarchy...`);

  // -------------------------------------------------------------------------
  // Strategy:
  //   - First ~40% of categories become roots (no parent).
  //   - Next ~35% become children of a random root.
  //   - Remaining ~25% become grandchildren of a random child.
  // This gives us a 3-level tree.
  // -------------------------------------------------------------------------
  const rootCount = Math.max(1, Math.floor(categories.length * 0.4));
  const childCount = Math.max(1, Math.floor(categories.length * 0.35));
  // grandchildren = the rest

  const roots = categories.slice(0, rootCount);
  const children = categories.slice(rootCount, rootCount + childCount);
  const grandchildren = categories.slice(rootCount + childCount);

  type Update = { uuid: Buffer; parent_uuid: Buffer | null; path: string };
  const updates: Update[] = [];

  // --- Roots: no parent, path = /<own_uuid> ---------------------------------
  for (const root of roots) {
    updates.push({
      uuid: root.uuid,
      parent_uuid: null,
      path: `/${bufToHex(root.uuid)}`,
    });
  }

  // --- Children: parent = random root, path = /<root>/<own> ------------------
  for (const child of children) {
    const parent = roots[Math.floor(Math.random() * roots.length)]!;
    updates.push({
      uuid: child.uuid,
      parent_uuid: parent.uuid,
      path: `/${bufToHex(parent.uuid)}/${bufToHex(child.uuid)}`,
    });
  }

  // --- Grandchildren: parent = random child, path = /<root>/<child>/<own> ----
  for (const gc of grandchildren) {
    const parentUpdate = updates.filter((u) => u.parent_uuid !== null);
    const parent = parentUpdate[Math.floor(Math.random() * parentUpdate.length)]!;
    updates.push({
      uuid: gc.uuid,
      parent_uuid: parent.uuid,
      path: `${parent.path}/${bufToHex(gc.uuid)}`,
    });
  }

  // --- Apply updates one-by-one (simple; category count is typically small) --
  console.log(`  Applying ${updates.length} hierarchy updates...`);

  for (const u of updates) {
    await db
      .updateTable('category')
      .set({
        parent_uuid: u.parent_uuid,
        path: u.path,
      })
      .where('uuid', '=', u.uuid)
      .execute();
  }

  // --- Quick sanity log ------------------------------------------------------
  const rootsCount = updates.filter((u) => u.parent_uuid === null).length;
  const childrenCount = updates.filter(
    (u) => u.parent_uuid !== null && u.path.split('/').length === 3,
  ).length;
  const gcCount = updates.filter(
    (u) => u.path.split('/').length >= 4,
  ).length;

  console.log(
    `✔ Category hierarchy applied: ${rootsCount} roots, ${childrenCount} children, ${gcCount} grandchildren.`,
  );
}
