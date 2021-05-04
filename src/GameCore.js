const Database = require('sqlite-async');

const main = async (ctx, double) => {
	// NOTA(RECKER): No contar puntos si no es el grupo definido
	/*if (ctx.chat.id !== -1001200393360) {
		return null;
	}*/

	const db = await Database.open('./moba.db');
	let sql = 'SELECT * FROM config WHERE id=1';
	
	const config = await db.get(sql);
	
	sql = 'SELECT * FROM experiences WHERE user_id=?';
	
	const experiences = await db.get(sql,[ctx.from.id]);
	
	// NOTA(RECKER): No hacer nada si el usuario no está registrado
	if (!experiences) {
		return null;
	}
	
	// NOTA(RECKER): Registrar otras que no sean mensajes
	if (!ctx.message.text) {
		sql = `UPDATE experiences
			SET points=points+${(config.points_base * 2) * (config.double_exp ? double : 1)}, pateria=CASE WHEN pateria > 0.24 THEN pateria - 0.24 ELSE 0 END, aggressiveness=CASE WHEN aggressiveness > 0.24 THEN aggressiveness - 0.24 ELSE 0 END
			WHERE user_id=?`;
		
		const user = await db.run(sql,[ctx.from.id]);
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
	const words = await db.all(sql) || [];
	
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
		WHERE user_id=?`;
	}else if (findWords === 2 && (findMention > 0 || findReply > 0)) {
		// NOTA(RECKER): Mensaje cariñoso (Mention o Reply)
		experiences.points += (config.points_base * 2) * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, pateria=pateria+8
		WHERE user_id=?`;
	}else if (findWords === 2) {
		// NOTA(RECKER): Mensaje cariñoso
		experiences.points += (config.points_base * 2) * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, pateria=pateria+5
		WHERE user_id=?`;
	}else if (findWords === 1) {
		// NOTA(RECKER): Mensaje con palabra
		experiences.points += (config.points_base * 2) * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, insults=insults+1 
		WHERE user_id=?`;
	}else {
		// NOTA(RECKER): Mensaje normal
		experiences.points += config.points_base * (config.double_exp ? double : 1);
		
		sql = `UPDATE experiences
		SET points=${experiences.points}, pateria=CASE WHEN pateria > 8 THEN pateria - 8 ELSE 0 END, aggressiveness=CASE WHEN aggressiveness > 8 THEN aggressiveness - 8 ELSE 0 END
		WHERE user_id=?`;
	}
	
	const user = await db.run(sql,[ctx.from.id]);
	
	// NOTA(RECKER): Aumentar nivel
	if (experiences.points >= (experiences.level * config.xp_need)) {
		experiences.level++
		sql = `UPDATE experiences
		SET level=${experiences.level}
		WHERE user_id=?`;
		
		await db.run(sql,[ctx.from.id]);
	}
}

module.exports = {
	main,
};