// NOTA(RECKER): Iniciar variables
const dotenv = require('dotenv');
dotenv.config();

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const options_db = {
	connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
}

const start_db = async () => {
	const client = new Client(options_db);
	
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
	sql = `CREATE TABLE IF NOT EXISTS debuffs (
		id SERIAL,
		user_id INT,
		user_from INT,
		type VARCHAR(30) NOT NULL,
		amount INT NOT NULL,
		xp_amount FLOAT NOT NULL,
		expired_at timestamp NOT NULL
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
		xp_need FLOAT DEFAULT 115,
		smoothness_discount FLOAT DEFAULT 2.5,
		aggressiveness_discount FLOAT DEFAULT 4.5,
		smoothness_aggregate FLOAT DEFAULT 5,
		aggressiveness_aggregate FLOAT DEFAULT 7
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
	
	// NOTA(RECKER): Top season
	sql = `CREATE TABLE IF NOT EXISTS top_season (
		ID SERIAL,
		user_id INT NULL
	);`
	
	await client.query(sql);
	
	await client.end();
	console.log('DB instalada!');
}

const down_db = async () => {
	const client = new Client(options_db);
	
	await client.connect();
	
	console.log('Reiniciando db...');
	
	// NOTA(RECKER): Obtener top season
	let sql = 'SELECT user_id FROM experiences ORDER BY points DESC LIMIT 1';
	
	let user = await client.query(sql);
	user = user.rows[0];
	
	if (user) {
		sql = 'INSERT INTO top_season (user_id) VALUES ($1)';
		
		await client.query(sql, [user.user_id]);
	}else {
		sql = 'INSERT INTO top_season (user_id) VALUES (NULL)';
		
		await client.query(sql);
	}
	
	// NOTA(RECKER): Tabla experiences
	sql = 'DROP TABLE IF EXISTS experiences, effects, debuffs, fights, postgress_sessions';
	
	await client.query(sql);
	
	await client.end();
	console.log('DB reiniciada!');
}

module.exports = {
	start_db,
	down_db,
	options_db,
};