const COLUMNS = `id, hive_id, author_id, inspected_at, colony_status, queen_present,
                 observations, version, created_at, updated_at`;

export function createInspectionsRepository(pool) {
  async function findById(id) {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM inspections WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }

  return {
    findById,

    async insertIfAbsent(inspection) {
      const { rows } = await pool.query(
        `INSERT INTO inspections (id, hive_id, author_id, inspected_at, queen_present,
                                  colony_status, observations)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING
         RETURNING ${COLUMNS}`,
        [inspection.id, inspection.hive_id, inspection.author_id, inspection.inspected_at,
         inspection.queen_present, inspection.colony_status, inspection.observations],
      );
      
      if (rows.length === 1) {
        return { inspection: rows[0], created: true };
      }
      // Si le RETURNING est vide, c'est que l'ID existait déjà
      return { inspection: await findById(inspection.id), created: false };
    },

    async updateIfVersion(inspection, expectedVersion) {
      const { rows } = await pool.query(
        `UPDATE inspections
         SET inspected_at = $3, colony_status = $4, queen_present = $5, observations = $6,
             version = version + 1, updated_at = now()
         WHERE id = $1 AND hive_id = $2 AND version = $7
         RETURNING ${COLUMNS}`,
        [inspection.id, inspection.hive_id, inspection.inspected_at, inspection.colony_status,
         inspection.queen_present, inspection.observations, expectedVersion],
      );
      return rows[0] ?? null;
    },

    async findByHive(hiveId) {
      const { rows } = await pool.query(
        `SELECT ${COLUMNS} FROM inspections WHERE hive_id = $1 ORDER BY inspected_at DESC`,
        [hiveId],
      );
      return rows;
    },
  };
}