export function createInspectionsRepository(pool) {
  return {
    async add(inspection) {
      const { rows } = await pool.query(
        `INSERT INTO inspections (hive_id, author_id, inspected_at, colony_status, queen_present, observations)
         VALUES ($1, (SELECT owner_id FROM hives WHERE id = $2), $3, $4, $5, $6)
         RETURNING id, hive_id, author_id, inspected_at, colony_status, queen_present, observations, version, created_at, updated_at`,
        [
          inspection.hive_id,
          inspection.hive_id, // $2 pour la sous-requête owner_id
          inspection.inspected_at,
          inspection.colony_status,
          inspection.queen_present ?? null,
          inspection.observations ?? null,
        ],
      );
      return rows[0];
    },

    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT id, hive_id, author_id, inspected_at, colony_status, queen_present, observations, version, created_at, updated_at
         FROM inspections
         WHERE hive_id = $1
         ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },
  };
}