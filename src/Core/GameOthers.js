// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const gameOthers = async (ctx) => {
	// NOTA(RECKER): Obtener datos de la db
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	// NOTA(RECKER): Obtener configuracion
	let sql = 'SELECT * FROM configs WHERE id=1';
	
	let config = await client.query(sql);
	config = config.rows[0];
	
	// NOTA(RECKER): No dar xp si no se ha instalado el juego
	if (config.chat_id != ctx.chat.id) {
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener datos del usuario
	sql = `SELECT experiences.user_id as id, experiences.points, experiences.level, parche_niveling.xp_debuff, parche_niveling.aggressiveness_debuff, parche_niveling.smoothness_debuff FROM experiences
INNER JOIN effects ON effects.user_id = experiences.user_id
LEFT JOIN parche_niveling ON parche_niveling.user_id = experiences.user_id
WHERE experiences.user_id=$1`;
	
	let experiences = await client.query(sql,[ctx.from.id]);
	experiences = experiences.rows[0];
	
	// NOTA(RECKER): No hacer nada si el usuario no estรก registrado
	if (!experiences) {
		await client.end();
		return null;
	}
	console.log(experiences, 'ANTES');
	
	// NOTA(RECKER): Obtener debuff
	sql = `SELECT debuffs.*, users.username FROM debuffs
INNER JOIN users ON users.id = debuffs.user_from
WHERE user_id=$1 AND expired_at > now() :: timestamp`;
	
	let debuffs = await client.query(sql,[ctx.from.id]);
	debuffs = debuffs.rows;
	
	// NOTA(RECKER): Acumular debuff
	let stats = {
		xp_debuff: 0,
		vida_debuff: 0,
		damage_debuff: 0,
		delete_message: 0,
		delete_message_random: 0,
		user_from: {},
	};

	debuffs.map((debuff) => {
		let keys = Object.keys(stats);
		keys.map((key) => {
			if (debuff.type === key) {
				stats[key] += debuff.amount;
				
				// NOTA(RECKER): Obtener el username_from
				stats.user_from[key] = !stats.user_from[key] ? debuff.username : stats.user_from[key];
			}
		});
	});
	
	// NOTA(RECKER): Dar puntos
	let ganado = ((config.points_base * 2) * config.double_exp);
	const xp_debuff = parseFloat(config.xp_debuff);
	if (xp_debuff > 0) {
		ganado = (ganado * xp_debuff) / 100;
	}
	
	experiences.points += Math.round10(ganado, -2);
	sql = `UPDATE experiences
		SET points=$1
		WHERE user_id=$2`;

	await client.query(sql,[experiences.points,ctx.from.id]);
	
	// NOTA(RECKER): Dar effectos
	sql = `UPDATE effects SET 
smoothness=CASE WHEN smoothness > $1 THEN smoothness - $1 ELSE 0 END, 
aggressiveness=CASE WHEN aggressiveness > $2 THEN aggressiveness - $2 ELSE 0 END
WHERE user_id=$3`;
	
	await client.query(sql,[config.smoothness_discount,config.aggressiveness_discount,ctx.from.id]);

	// NOTA(RECKER): Aumentar nivel
	if (experiences.points >= (experiences.level * config.xp_need)) {
		experiences.level++
		sql = `UPDATE experiences
		SET level=$1
		WHERE user_id=$2`;
		
		await client.query(sql,[experiences.level,ctx.from.id]);
	}
	
	console.log(experiences);
	await client.end();
}

module.exports = gameOthers;