export function createMeasuresRepository(pool) {
  return {
    async add(measure) {
      const { rows } = await pool.query(
        `INSERT INTO measures (hive_id, measured_at, weight_kg, temp_internal_c, temp_external_c,
                               humidity_pct, acoustic_activity_score, battery_pct, lat, lon)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING hive_id, measured_at AS timestamp,
                   lat AS position_lat, lon AS position_lon,
                   weight_kg, temp_internal_c, temp_external_c, humidity_pct,
                   acoustic_activity_score, battery_pct`,
        [
          measure.hive_id,
          measure.timestamp,      // colonne measured_at
          measure.weight_kg,
          measure.temp_internal_c,
          measure.temp_external_c,
          measure.humidity_pct,
          measure.acoustic_activity_score,
          measure.battery_pct,
          measure.position_lat,   // colonne lat
          measure.position_lon,   // colonne lon
        ],
      );
      
      // Le site_id n'est pas dans la table measures, il faut le récupérer
      const inserted = rows[0];
      const { rows: hiveRows } = await pool.query(
        `SELECT site_id FROM hives WHERE id = $1`,
        [inserted.hive_id]
      );
      inserted.site_id = hiveRows[0]?.site_id ?? null;
      
      return inserted;
    },

    async findByHive(hiveId, { limit, offset }) {
      const { rows } = await pool.query(
        `SELECT m.hive_id, h.site_id, m.measured_at AS timestamp,
                m.lat AS position_lat, m.lon AS position_lon,
                m.weight_kg, m.temp_internal_c, m.temp_external_c, m.humidity_pct,
                m.acoustic_activity_score, m.battery_pct
         FROM measures m
         JOIN hives h ON h.id = m.hive_id
         WHERE m.hive_id = $1
         ORDER BY m.measured_at DESC
         LIMIT $2 OFFSET $3`,
        [hiveId, limit, offset],
      );
      return rows;
    },
  };
}