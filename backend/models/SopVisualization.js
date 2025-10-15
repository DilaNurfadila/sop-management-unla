/**
 * Model: SopVisualization
 *
 * Menyimpan data visualisasi SOP (mis. node/edge untuk flowchart atau representasi grafis lainnya).
 *
 * Catatan:
 * - Berelasi dengan SOP dan komponen UI yang menampilkan alur kerja.
 */
const db = require("../config/db");

class SopVisualization {
  static async getBySopDocId(sopDocId) {
    const [rows] = await db.execute(
      `SELECT * FROM sop_visualization WHERE activity_id = ? ORDER BY id ASC`,
      [sopDocId]
    );
    return rows;
  }

  static async create(data) {
    const {
      activity_id,
      person_id,
      status,
      completeness,
      time_required,
      output,
      notes,
      return_to_activity_id,
    } = data;

    const [result] = await db.execute(
      `INSERT INTO sop_visualization
      (activity_id, person_id, status, completeness, time_required, output, notes, return_to_activity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity_id,
        person_id,
        status,
        completeness ?? null,
        time_required ?? null,
        output ?? null,
        notes ?? null,
        return_to_activity_id ?? null,
      ]
    );
    return { id: result.insertId, ...data };
  }

  static async update(id, data) {
    const {
      status,
      completeness,
      time_required,
      output,
      notes,
      return_to_activity_id,
    } = data;

    await db.execute(
      `UPDATE sop_visualization 
       SET status = ?, completeness = ?, time_required = ?, output = ?, notes = ?, return_to_activity_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        status,
        completeness ?? null,
        time_required ?? null,
        output ?? null,
        notes ?? null,
        return_to_activity_id ?? null,
        id,
      ]
    );
    return { id, ...data };
  }

  static async delete(id) {
    await db.execute(`DELETE FROM sop_visualization WHERE id = ?`, [id]);
    return true;
  }

  static async saveBulk(visualizations) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      for (const v of visualizations) {
        if (v.id) {
          // update
          await conn.execute(
            `UPDATE sop_visualization 
             SET status = ?, completeness = ?, time_required = ?, output = ?, notes = ?, return_to_activity_id = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
              v.status,
              v.completeness ?? null,
              v.time_required ?? null,
              v.output ?? null,
              v.notes ?? null,
              v.return_to_activity_id ?? null,
              v.id,
            ]
          );
        } else {
          // insert
          await conn.execute(
            `INSERT INTO sop_visualization
            (activity_id, person_id, status, completeness, time_required, output, notes, return_to_activity_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              v.activity_id,
              v.person_id,
              v.status,
              v.completeness ?? null,
              v.time_required ?? null,
              v.output ?? null,
              v.notes ?? null,
              v.return_to_activity_id ?? null,
            ]
          );
        }
      }

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = SopVisualization;
