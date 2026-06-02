const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { hashPassword } = require('../src/utils/password');

const rootPath = path.resolve(__dirname, '..');
const envPath = path.join(rootPath, '.env');
const migrationsPath = path.join(rootPath, 'migrations');

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');

    envFile.split(/\r?\n/).forEach((line) => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);

        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2] || '';
        }
    });
}

async function setupDatabase() {
    const dbName = process.env.DB_NAME || 'loja_spfc';
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);
    await connection.query(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL UNIQUE,
            executada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const migrationFiles = fs.readdirSync(migrationsPath).filter((file) => file.endsWith('.sql')).sort();

    for (const file of migrationFiles) {
        const [rows] = await connection.query('SELECT id FROM migrations WHERE nome = ? LIMIT 1', [file]);

        if (rows.length > 0) {
            console.log(`Migration ja aplicada: ${file}`);
            continue;
        }

        const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
        await connection.query(sql);
        await connection.query('INSERT INTO migrations (nome) VALUES (?)', [file]);
        console.log(`Migration aplicada: ${file}`);
    }

    const [admins] = await connection.query("SELECT id FROM usuarios WHERE tipo_usuario = 'Admin' LIMIT 1");

    if (admins.length === 0) {
        await connection.query(
            `INSERT INTO usuarios (nome, email, senha, cpf, tipo_usuario)
             VALUES (?, ?, ?, ?, 'Admin')`,
            [
                process.env.ADMIN_NAME || 'Administrador',
                process.env.ADMIN_EMAIL || 'admin@spfc.com',
                hashPassword(process.env.ADMIN_PASSWORD || 'admin123'),
                process.env.ADMIN_CPF || '000.000.000-00'
            ]
        );

        console.log('Usuario admin inicial criado.');
    }

    await connection.end();
    console.log(`Banco ${dbName} criado/atualizado com sucesso.`);
}

setupDatabase().catch((error) => {
    console.error('Erro ao criar/atualizar o banco:', error.message);
    process.exit(1);
});
