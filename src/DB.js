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
		user_id INT UNIQUE,
		points FLOAT NOT NULL DEFAULT 0,
		level INT NOT NULL DEFAULT 1,
		insults INT NOT NULL DEFAULT 0,
		blushed INT NOT NULL DEFAULT 0
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Effects
	sql = `CREATE TABLE IF NOT EXISTS effects (
		id SERIAL,
		user_id INT UNIQUE,
		aggressiveness FLOAT NOT NULL DEFAULT 0,
		smoothness FLOAT NOT NULL DEFAULT 0
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Tabla punishments
	sql = `CREATE TABLE IF NOT EXISTS actions (
		id SERIAL,
		user_id INT UNIQUE,
		user_from INT,
		xp_debuff FLOAT NOT NULL DEFAULT 0,
		vida_debuff FLOAT NOT NULL DEFAULT 0,
		damage_debuff FLOAT NOT NULL DEFAULT 0,
		smoothness_debuff FLOAT NOT NULL DEFAULT 0,
		aggressiveness_debuff FLOAT NOT NULL DEFAULT 0,
		delete_message INT NOT NULL DEFAULT 0,
		delete_message_random INT NOT NULL DEFAULT 0,
		remember TEXT NOT NULL DEFAULT 0,
		expired_at_date date NOT NULL,
		expired_at_hora time NOT NULL
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Asignar datos faltantes a usuarios
	sql = 'SELECT id FROM users';
	
	let users = await client.query(sql);
	users = users.rows;
	
	let i = 0;
	while(users[i]) {
		const user = users[i];
		
		sql = 'INSERT INTO experiences (user_id) VALUES ($1);';
	
		const res = await client.query(sql, [user.id]);
		
		sql = 'INSERT INTO effects (user_id) VALUES ($1);';
		
		await client.query(sql, [user.id]);
		
		i++;
	}
	
	// NOTA(RECKER): Tabla config
	sql = `CREATE TABLE IF NOT EXISTS configs (
		id SERIAL,
		owner_id bigint NULL,
		chat_id bigint NULL,
		double_exp INTEGER DEFAULT 1,
		points_base FLOAT DEFAULT 1,
		vida_base FLOAT DEFAULT 20,
		damage_base FLOAT DEFAULT 5,
		xp_need FLOAT DEFAULT 75,
		smoothness_discount FLOAT DEFAULT 2.5,
		aggressiveness_discount FLOAT DEFAULT 4.5,
		smoothness_aggregate FLOAT DEFAULT 5,
		aggressiveness_aggregate FLOAT DEFAULT 8
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Crear configuracion
	sql = 'SELECT id FROM configs';
	
	let configs = await client.query(sql);
	configs = configs.rows[0];
	
	i = 0;
	if (!configs) {
		sql = 'INSERT INTO configs (owner_id) VALUES (NULL)';
		
		await client.query(sql);
	}
	
	// NOTA(RECKER): Tabla parche_niveling
	sql = `CREATE TABLE IF NOT EXISTS parche_niveling (
		id SERIAL,
		user_id INT UNIQUE,
		xp_debuff FLOAT NOT NULL DEFAULT 0,
		vida_debuff FLOAT NOT NULL DEFAULT 0,
		damage_debuff FLOAT NOT NULL DEFAULT 0,
		aggressiveness_debuff FLOAT NOT NULL DEFAULT 0,
		smoothness_debuff FLOAT NOT NULL DEFAULT 0
	);`
	
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
		golpe VARCHAR(255) UNIQUE NOT NULL
	);`
	
	await client.query(sql);
	
	// NOTA(RECKER): Sessions
	sql = `CREATE TABLE IF NOT EXISTS postgress_sessions (id varchar(200) UNIQUE, session text);`
	
	await client.query(sql);
	
	await client.end();
	console.log('DB instalada!');
}

const down_db = async () => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	console.log('Reiniciando db...');
	
	// NOTA(RECKER): Tabla experiences
	let sql = 'DROP TABLE IF EXISTS experiences, effects, actions, parche_niveling, fights, postgress_sessions, config';
	
	await client.query(sql);
	
	await client.end();
	console.log('DB reiniciada!');
}

module.exports = {
	start_db,
	down_db,
};