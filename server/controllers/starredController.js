import { sql } from "../config/db.js";

// Get all starred folders and files for the authenticated user
// GET /api/starred
export const getStarredItems = async (req, res) => {
    try {
        const [folders, files] = await Promise.all([
            sql`
            SELECT * FROM folders 
            WHERE owner_id = ${req.user.id} AND is_starred = true AND is_trashed = false 
            ORDER BY name ASC
            `,
            sql`
            SELECT * FROM files 
            WHERE owner_id = ${req.user.id} AND is_starred = true AND is_trashed = false 
            ORDER BY updated_at DESC
            `,
        ]);

        return res.status(200).json({ folders, files });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

