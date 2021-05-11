// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const { calculate_level } = require('./settings/AddXP');

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
	sql = `SELECT experiences.user_id as id, experiences.points, experiences.level, effects.aggressiveness, effects.smoothness FROM experiences
INNER JOIN effects ON effects.user_id = experiences.user_id
WHERE experiences.user_id=$1`;
	
	let user_data = await client.query(sql,[ctx.from.id]);
	user_data = user_data.rows[0];
	
	// NOTA(RECKER): No hacer nada si el usuario no estรก registrado
	if (!user_data) {
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener debuff
	sql = `SELECT amount FROM debuffs
WHERE user_id=$1 AND expired_at > now() :: timestamp AND type = 'xp_debuff'`;
	
	let debuffs = await client.query(sql,[ctx.from.id]);
	debuffs = debuffs.rows;
	
	// NOTA(RECKER): Acumular debuff
	let debuffs_actives = {
		xp_debuff: 0,
	};

	debuffs.map((debuff) => {
		let keys = Object.keys(debuffs_actives);
		keys.map((key) => {
			if (debuff.type === key) {
				debuffs_actives[key] += debuff.amount;
			}
		});
	});
	
	// NOTA(RECKER): Descontar efectos si no se ha dicho nada
	user_data.aggressiveness -= config.aggressiveness_discount;
	user_data.aggressiveness = user_data.aggressiveness <= 0 ? 0 : user_data.aggressiveness;
	user_data.aggressiveness = Math.round10(user_data.aggressiveness, -2);
		
	user_data.smoothness -= config.smoothness_discount;
	user_data.smoothness = user_data.smoothness <= 0 ? 0 : user_data.smoothness;
	user_data.smoothness = Math.round10(user_data.smoothness, -2);
	
	// NOTA(RECKER): Agregar xp base
	let addxp_messages = 2;
	addxp_messages += config.points_base * config.double_exp;
	user_data.points += addxp_messages - ((debuffs_actives.xp_debuff * addxp_messages) / 100) || 0;
	user_data.points = Math.round10(user_data.points, -2);
	
	// NOTA(RECKER): Aumentar nivel
	if (user_data.points >= (user_data.level * config.xp_need)) {
		let levels = calculate_level(user_data.points, config.xp_need);
		user_data.level = levels;
	}
	
	// NOTA(RECKER): Actualizar datos
	sql = `UPDATE experiences
		SET points=$1, level=$2
		WHERE user_id=$3`;
	
	await client.query(sql,[user_data.points, user_data.level, ctx.from.id]);
	
	sql = `UPDATE effects SET aggressiveness=$1, smoothness=$2 WHERE user_id=$3`;
	
	await client.query(sql,[user_data.aggressiveness, user_data.smoothness, ctx.from.id]);
	
	await client.end();
}

module.exports = gameOthers;