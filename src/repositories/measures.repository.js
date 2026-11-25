export function createMeasuresRepository(pool) {
  // Fonction utilitaire pour relire une mesure (que ce soit une création ou un doublon)
  async function findOne(hiveId, timestamp) {
    const { rows } = await pool.query(
      `SELECT m.hive_id, h.site_id, m.measured_at AS timestamp,
              m.lat AS position_lat, m.lon AS position_lon,
              m.weight_kg, m.temp_internal_c, m.temp_external_c, m.humidity_pct,
              m.acoustic_activity_score, m.battery_pct
       FROM measures m
       JOIN hives h ON h.id = m.hive_id
       WHERE m.hive_id = $1 AND m.measured_at = $2`,
      [hiveId, timestamp],
    );
    return rows[0] ?? null;
  }

  return {
    async add(measure) {
      // 1. On essaie d'insérer, en ignorant si la clé primaire (hive_id, measured_at) existe déjà
      const { rowCount } = await pool.query(
        `INSERT INTO measures (hive_id, measured_at, weight_kg, temp_internal_c, temp_external_c,
                               humidity_pct, acoustic_activity_score, battery_pct, lat, lon)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (hive_id, measured_at) DO NOTHING`,
        [
          measure.hive_id,
          measure.timestamp,
          measure.weight_kg,
          measure.temp_internal_c,
          measure.temp_external_c,
          measure.humidity_pct,
          measure.acoustic_activity_score,
          measure.battery_pct,
          measure.position_lat,
          measure.position_lon,
        ],
      );
      
      // 2. On relit la mesure (qu'elle ait été créée ou qu'elle existe déjà)
      const storedMeasure = await findOne(measure.hive_id, measure.timestamp);
      
      // 3. On renvoie l'objet avec l'info "created"
      return { measure: storedMeasure, created: rowCount === 1 };
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