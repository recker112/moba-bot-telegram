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
	
	// NOTA(RECKER): Obtener castigos
	sql = `SELECT actions.*, users.username FROM actions
INNER JOIN users ON users.id = actions.user_from
WHERE user_id=$1 AND expired_at_date > now() :: date AND expired_at_hora > now() :: time`;
	
	let actions = await client.query(sql,[ctx.from.id]);
	actions = actions.rows;
	
	let delete_menssage = 0;
	let delete_menssage_random = 0;
	let xp_debuff_action = 0;
	let smoothness_debuff_action = 0;
	let aggressiveness_debuff_action = 0;
	let delete_from = '';
	actions && actions.map((action) => {
		if (action.delete_message > 0 && !delete_from) {
			delete_menssage++;
			delete_from = {
				id: action.user_from,
				username: action.username
			};
		}else if (action.delete_message_random > 0 && !delete_from) {
			delete_menssage_random++;
			delete_from = {
				id: action.user_from,
				username: action.username
			};
		}else if (action.xp_debuff > 0 && (xp_debuff_action+action.xp_debuff) < 75) {
			xp_debuff_action += action.xp_debuff
		}
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