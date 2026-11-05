
const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Kiem tra ket noi va tao bang
async function initDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Them cot trang thai hoan thanh
    await pool.query(`
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS completed
        BOOLEAN NOT NULL DEFAULT FALSE
    `);

    console.log('Da cap nhat bang tasks thanh cong!');
}

// Lay danh sach cong viec
app.get('/api/tasks', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM tasks ORDER BY id DESC'
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Loi lay cong viec'
        });
    }
});

// Them cong viec
app.post('/api/tasks', async (req, res) => {
    try {
        const { title } = req.body;

        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                message: 'Ten cong viec khong hop le'
            });
        }

        const result = await pool.query(
            `INSERT INTO tasks (title)
             VALUES ($1)
             RETURNING *`,
            [title.trim()]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Loi them cong viec'
        });
    }
});

// Danh dau hoan thanh hoac chua hoan thanh
app.patch('/api/tasks/:id/complete', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'ID khong hop le'
            });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET completed = NOT completed
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Khong tim thay cong viec'
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Loi cap nhat trang thai'
        });
    }
});

// Chinh sua ten cong viec
app.put('/api/tasks/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'ID khong hop le'
            });
        }

        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({
                message: 'Ten cong viec khong hop le'
            });
        }

        const result = await pool.query(
            `UPDATE tasks
             SET title = $1
             WHERE id = $2
             RETURNING *`,
            [title.trim(), id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Khong tim thay cong viec'
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Loi chinh sua cong viec'
        });
    }
});

// Xoa cong viec
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'ID khong hop le'
            });
        }

        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: 'Khong tim thay cong viec'
            });
        }

        res.json({
            message: 'Da xoa cong viec thanh cong'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Loi xoa cong viec'
        });
    }
});

// Khoi dong server
initDatabase()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log('Server dang chay tai port ' + PORT);
        });
    })
    .catch(error => {
        console.error('Khong the khoi tao database:', error);
        process.exit(1);
    });
