
require('dotenv').config();

const bcrypt = require('bcryptjs');
const readline = require('readline');
const pool = require('../backend/config');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});

function ask(question) {
    return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

    if (!email) {
        throw new Error('Set ADMIN_EMAIL in your .env file first.');
    }

    const name = await ask('Admin full name: ');
    const password = await ask('Choose a strong admin password: ');

    if (password.length < 12) {
        throw new Error('Use a password of at least 12 characters.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const existing = await client.query(
            'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
            [email]
        );

        if (existing.rows.length) {
            throw new Error(
                'A user with this email already exists. No records were changed.'
            );
        }

        const userResult = await client.query(
            `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'admin')
       RETURNING id`,
            [email, passwordHash]
        );

        const userId = userResult.rows[0].id;

        await client.query(
            `INSERT INTO admins (user_id, name, email, role)
       VALUES ($1, $2, $3, 'admin')`,
            [userId, name.trim(), email]
        );

        await client.query('COMMIT');

        console.log(`Admin created successfully: ${email}`);
        console.log(`User ID: ${userId}`);
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

main()
    .catch((error) => {
        console.error('Admin creation failed:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        rl.close();
        await pool.end();
    });
