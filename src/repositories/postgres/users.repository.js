export function createUsersRepository(pool) {
  return {
    async findByEmail(email) {
      const { rows } = await pool.query(
        `SELECT id, email, password_hash, role, site_id, locked_until FROM users WHERE email = $1`,
        [email],
      );
      return rows[0] ?? null;
    },

    async findById(id) {
      const { rows } = await pool.query(
        `SELECT id, email, role, site_id, locked_until FROM users WHERE id = $1`,
        [id],
      );
      return rows[0] ?? null;
    },

    async create({ email, password_hash, role, site_id }) {
      const { rows } = await pool.query(
        `INSERT INTO users (email, password_hash, role, site_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, role, site_id, created_at`,
        [email, password_hash, role, site_id],
      );
      return rows[0];
    },

    async resetFailedLogins(id) {
      await pool.query(`UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1`, [id]);
    },

    async recordFailedLogin(id, maxFailed, lockMinutes) {
      const { rows } = await pool.query(
        `UPDATE users
         SET failed_attempts = CASE WHEN failed_attempts + 1 >= $2 THEN 0 ELSE failed_attempts + 1 END,
             locked_until    = CASE WHEN failed_attempts + 1 >= $2
                                    THEN now() + make_interval(mins => $3)
                                    ELSE locked_until END
         WHERE id = $1
         RETURNING CASE WHEN locked_until > now() THEN locked_until END AS locked_until`,
        [id, maxFailed, lockMinutes],
      );
      return rows[0]?.locked_until ?? null;
    },
  };
}