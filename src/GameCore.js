const Database = require('sqlite-async');

const main = async (ctx, double) => {
	let base_points = 1;

	const db = await Database.open('./moba.db');
	let sql = 'SELECT * FROM config WHERE id=1';
	
	const config = await db.get(sql);
	
	// NOTA(RECKER): Registrar otras que no sean mensajes
	if (!ctx.message.text) {
		sql = `UPDATE experiences
			SET points=points+${(base_points + 1) * (config.double_exp ? double : 1)}, pateria=CASE WHEN pateria > 0.24 THEN pateria - 0.24 ELSE 0 END, aggressiveness=CASE WHEN aggressiveness > 0.24 THEN aggressiveness - 0.24 ELSE 0 END
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
	
	if (findWords === 1 && (findMention > 0 || findReply > 0)) {
		// NOTA(RECKER): Mensaje con agresividad
		sql = `UPDATE experiences
		SET points=points+${(base_points * 2) * (config.double_exp ? double : 1)}, insults=insults+1,
aggressiveness=aggressiveness+1
		WHERE user_id=?`;
	}else if (findWords === 2 && (findMention > 0 || findReply > 0)) {
		// NOTA(RECKER): Mensaje cariñoso (Mention o Reply)
		sql = `UPDATE experiences
		SET points=points+${(base_points * 2) * (config.double_exp ? double : 1)}, pateria=pateria+2
		WHERE user_id=?`;
	}else if (findWords === 2) {
		// NOTA(RECKER): Mensaje cariñoso
		sql = `UPDATE experiences
		SET points=points+${(base_points * 2) * (config.double_exp ? double : 1)}, pateria=pateria+1
		WHERE user_id=?`;
	}else if (findWords === 1) {
		// NOTA(RECKER): Mensaje con palabra
		sql = `UPDATE experiences
		SET points=points+${(base_points * 2) * (config.double_exp ? double : 1)}, insults=insults+1 
		WHERE user_id=?`;
	}else {
		// NOTA(RECKER): Mensaje normal
		sql = `UPDATE experiences
		SET points=points+${base_points * (config.double_exp ? double : 1)}, pateria=CASE WHEN pateria > 0.24 THEN pateria - 0.24 ELSE 0 END, aggressiveness=CASE WHEN aggressiveness > 0.24 THEN aggressiveness - 0.24 ELSE 0 END
		WHERE user_id=?`;
	}
	
	const user = await db.run(sql,[ctx.from.id]);
}

module.exports = {
	main,
};