// NOTA(RECKER): Conectarse a la DB
const Database = require('sqlite-async');

const start_db = async () => {
	console.log('Iniciando DB...');
	const db = await Database.open("./moba.db");
	
	// NOTA(RECKER): Tabla Users
	let sql = `CREATE TABLE IF NOT EXISTS users (
		id BIGINTEGER NOT NULL UNIQUE,
		username VARCHAR(50) NOT NULL
	);`
	
	await db.run(sql);
	
	// NOTA(RECKER): Tabla experiences
	sql = `CREATE TABLE IF NOT EXISTS experiences (
		id INTEGER PRIMARY KEY,
		user_id BIGINTEGER,
		points BIGINTEGER NOT NULL DEFAULT 0,
		insults BIGINTEGER NOT NULL DEFAULT 0,
		aggressiveness FLOAT NOT NULL DEFAULT 0,
		pateria FLOAT NOT NULL DEFAULT 0
	);`
	
	await db.run(sql);
	
	// NOTA(RECKER): Tabla config
	sql = `CREATE TABLE IF NOT EXISTS config (
		id INTEGER PRIMARY KEY,
		double_exp BOOLEAN DEFAULT 0
	);`
	
	await db.run(sql);
	
	sql = "INSERT INTO config (double_exp) VALUES (0)";
	
	await db.run(sql);
	
	// NOTA(RECKER): Tabla words
	sql = `CREATE TABLE IF NOT EXISTS words (
		word VARCHAR(50) NOT NULL UNIQUE,
		status INTEGER NOT NULL DEFAULT 1
	);`
	
	await db.run(sql);
	console.log('DB iniciada!');
}

start_db();