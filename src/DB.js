// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const start_db = async () => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	console.log('Instalando db...');
	
	// NOTA(RECKER): Tabla Users
	let sql = `CREATE TABLE IF NOT EXISTS users (
		id INT NOT NULL UNIQUE,
		username VARCHAR(50) NOT NULL
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Tabla experiences
	sql = `CREATE TABLE IF NOT EXISTS experiences (
		id SERIAL,
		user_id INT,
		points INT NOT NULL DEFAULT 0,
		level INT NOT NULL DEFAULT 1,
		insults INT NOT NULL DEFAULT 0,
		aggressiveness FLOAT NOT NULL DEFAULT 0,
		pateria FLOAT NOT NULL DEFAULT 0
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Tabla config
	sql = `CREATE TABLE IF NOT EXISTS config (
		id SERIAL,
		double_exp BOOLEAN DEFAULT FALSE,
		points_base FLOAT DEFAULT 1,
		vida_base FLOAT DEFAULT 20,
		damage_base FLOAT DEFAULT 5,
		xp_need INTEGER DEFAULT 75
	);`
	
	await client.query(sql);
	
	sql = "INSERT INTO config (double_exp) VALUES (FALSE)";
	
	await client.query(sql);
	
	// NOTA(RECKER): Tabla words
	sql = `CREATE TABLE IF NOT EXISTS words (
		word VARCHAR(50) NOT NULL UNIQUE,
		status INTEGER NOT NULL DEFAULT 1
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Tabla fights
	sql = `CREATE TABLE IF NOT EXISTS fights (
		id SERIAL,
		user_win INT NOT NULL,
		user_lose INT NOT NULL
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Tabla fights
	sql = `CREATE TABLE IF NOT EXISTS fight_golpes (
		id SERIAL,
		golpe VARCHAR(255) NOT NULL
	);`
	
	await client.query(sql);
	
	await client.end();
	console.log('DB instalada!');
}

start_db();