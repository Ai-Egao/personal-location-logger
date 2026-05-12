import { sql } from '../models/db.js';

// Add Visit
export const addVisit = async (req, res) => {
    try {
        const { location, date, notes } = req.body;

        await sql.query`
            INSERT INTO Visits (location, date, notes)
            VALUES (${location}, ${date}, ${notes})
        `;

        res.send("Visit added successfully");
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Get Visits
export const getVisits = async (req, res) => {
    try {
        const { location } = req.query;

        if (!location) {
            return res.render('DisplayVisits', { visits: [], location: '' });
        }

        const request = new sql.Request();
        request.input('location', sql.NVarChar, location);

        const result = await request.query(`SELECT * FROM Visits WHERE location = @location`);
        res.render('DisplayVisite', { visits: result.recordset, location });
    } catch (err) {
        res.status(500).send(err.message);
    }
};

export const getAllVisits = async (req, res) => {
    try {
        const result = await sql.query`SELECT * FROM Visits ORDER BY date DESC`;
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Delete Visit
export const deleteVisit = async (req, res) => {
    try {
        const { visit_id } = req.body;

        await sql.query`
            DELETE FROM Visits WHERE id = ${visit_id}
        `;

        res.send("Visit deleted");
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Update Visit
export const updateVisit = async (req, res) => {
    try {
        const { visit_id, location, date, notes } = req.body;  // add notes

        await sql.query`
            UPDATE Visits
            SET location = ${location},
                date     = ${date},
                notes    = ${notes}          
            WHERE id = ${visit_id}
        `;

        res.send("Visit updated");
    } catch (err) {
        res.status(500).send(err.message);
    }
};

// Reports
export const getReports = async (req, res) => {
    try {
        const { type } = req.query;

        if (type === "most-visited") {
            const result = await sql.query`
                SELECT location, COUNT(*) as visits
                FROM Visits
                GROUP BY location
                ORDER BY visits DESC
            `;

            res.json(result.recordset);
        } else {
            res.send("Report type not supported yet");
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
};