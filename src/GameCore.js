// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const main = async (ctx, double) => {
	// NOTA(RECKER): No contar puntos si no es el grupo definido
	/*if (ctx.chat.id !== -1001200393360) {
		return null;
	}*/

	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = 'SELECT * FROM config WHERE id=1';
	
	let config = await client.query(sql);
	config = config.rows[0];
	
	sql = 'SELECT * FROM experiences WHERE user_id=$1';
	
	let experiences = await client.query(sql,[ctx.from.id]);
	experiences = experiences.rows[0];
	
	// NOTA(RECKER): No hacer nada si el usuario no está registrado
	if (!experiences) {
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Registrar otras que no sean mensajes
	if (!ctx.message.text) {
		sql = `UPDATE experiences
			SET points=points+${(config.points_base * 2) * (config.double_exp ? double : 1)}, pateria=CASE WHEN pateria > 8 THEN pateria - 8 ELSE 0 END, aggressiveness=CASE WHEN aggressiveness > 8 THEN aggressiveness - 8 ELSE 0 END
			WHERE user_id=$1`;
		
		await client.query(sql,[ctx.from.id]);
		
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener menciones
	let mentions = ctx.message.entities || [];
	let findMention = 0;
	
	let users = mentions.map((mention) => {
		if (mention.type === 'mention') {
			const user = ctx.message.text.slice(mention.offset,mention.length).toString();
			
			if (user !== `@${ctx.from.username}`) {
				findMention = 1;
				return user;
			}
		}
		return null;
	});
	
	// NOTA(RECKER): Obtener respuestas
	let reply_to = ctx.message.reply_to_message;
	let findReply = 0;
	if (reply_to) {
		findReply = '@'+reply_to.from.username === ctx.from.username ? 0 : 1;
	}
	
	// NOTA(RECKER): LISTA DE PALABRAS MULTIPLICADORAS
	sql = 'SELECT * FROM words';
	let words = await client.query(sql);
	words = words.rows;
	
	let findWords = 0;
	let findWordsLevel
	words.forEach(({ word, status }) => {
		if (findWords === 0) {
			if (ctx.message.text.search(word) > -1) {
				findWords = status;
			}
		}
		
		if (findWords === 0) {
			if (ctx.message.text.search(word.toUpperCase()) > -1) {
				findWords = status;
			}
		}
		
		if (findWords === 0) {
			let find = word.charAt(0).toUpperCase() + word.slice(1);
			if (ctx.message.text.search(find) > -1) {
				findWords = status;
			}
		}
	});
	
	// NOTA(RECKER): Distribución de puntos
	if (findWords === 1 && (findMention > 0 || findReply > 0)) {
		// NOTA(RECKER): Mensaje con agresividad
		experiences.points += (config.points_base * 2) * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, insults=insults+1,
aggressiveness=aggressiveness+8
		WHERE user_id=$1`;
	}else if (findWords === 2 && (findMention > 0 || findReply > 0)) {
		// NOTA(RECKER): Mensaje cariñoso (Mention o Reply)
		experiences.points += (config.points_base * 2) * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, pateria=pateria+8
		WHERE user_id=$1`;
	}else if (findWords === 2) {
		// NOTA(RECKER): Mensaje cariñoso
		experiences.points += (config.points_base * 2) * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, pateria=pateria+5
		WHERE user_id=$1`;
	}else if (findWords === 1) {
		// NOTA(RECKER): Mensaje con palabra
		experiences.points += (config.points_base * 2) * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, insults=insults+1 
		WHERE user_id=$1`;
	}else {
		// NOTA(RECKER): Mensaje normal
		experiences.points += config.points_base * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, pateria=CASE WHEN pateria > 8 THEN pateria - 8 ELSE 0 END, aggressiveness=CASE WHEN aggressiveness > 8 THEN aggressiveness - 8 ELSE 0 END
		WHERE user_id=$1`;
	}
	
	const user = await client.query(sql,[ctx.from.id]);
	
	// NOTA(RECKER): Aumentar nivel
	if (experiences.points >= (experiences.level * config.xp_need)) {
		experiences.level++
		sql = `UPDATE experiences
		SET level=${experiences.level}
		WHERE user_id=$1`;
		
		await client.query(sql,[ctx.from.id]);
	}
	
	await client.end();
}

module.exports = {
	main,
};