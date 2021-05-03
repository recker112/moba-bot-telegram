const Database = require('sqlite-async');

const top = async (ctx, vida, damage) => {
	const db = await Database.open('./moba.db');
	let sql = `SELECT users.username, experiences.points, experiences.insults, experiences.aggressiveness, experiences.pateria
		FROM users
		INNER JOIN experiences ON users.id = experiences.user_id
		ORDER BY experiences.points DESC
		LIMIT 5`;

	const users = await db.all(sql);

	let text = '|-------------------- *TOP 5* --------------------|\n';
	users.map((user, i) => {
		const nivel = Math.floor(user.points * 0.01) + 1;
		const aggressiveness = Math.round10(user.aggressiveness, -2);
		const pato = Math.round10(user.pateria, -2);

		const damage_base = 5 * nivel;
		const vida_base = 20 * nivel;
		
		text += `*#${i+1} @${user.username}*\n`;
		text += `- Nivel: ${nivel}\n`;
		text += `- Exp: ${user.points} pts\n`;
		text += `- Vida: ${vida_base - ((vida_base * pato) / 100)}\n`;
		text += `- Daño: ${damage_base + ((damage_base * aggressiveness) / 100)}\n`;
		text += `- Insultos: ${user.insults}\n`;
		text += `_- Agresividad: ${aggressiveness}%_\n`;
		text += `_- Cariñosidad: ${pato}%_\n`;
		if (users[i + 1]) {
			text = text + '\n\n';
		}
	});

	let response = await ctx.replyWithMarkdown(text);
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
	}, 20000);
}

const pelea = async (ctx) => {
	// NOTA(RECKER): Validad mencion
	if (ctx.message.entities.length !== 2) {
		let response = await ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /pelea @usuario');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 5000);
		return null;
	}
	
	if (ctx.message.entities[1].type !== 'mention') {
		let response = await ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /pelea @usuario');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 5000);
		return null;
	}
	const offset = ctx.message.entities[1].offset;
	const length = ctx.message.entities[1].length;
	
	let username = ctx.message.text.slice(offset, length + offset);
	
	const db = await Database.open('./moba.db');
	let sql = "SELECT * FROM users WHERE username=?";
	
	const user = await db.get(sql, [username.slice(1)]);
	
	let user_fight = ctx.message.text.slice()
	console.log(user);
}

const c_prendio = async (ctx, double) => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	
	const db = await Database.open('./moba.db');
	let sql = "SELECT * FROM config WHERE id=1";
	
	const config = await db.get(sql);
	
	sql = "UPDATE config SET double_exp=? WHERE id=1";
	const res = await db.run(sql,[!config.double_exp]);
	
	if (!config.double_exp) {
		ctx.replyWithMarkdown(`*MODO AGRESIVIDAD ACTIVA.*\nAhora hay un x${double} en la EXP.`);
	}else {
		ctx.replyWithMarkdown('*Se acabó lo que se daba.*\nAhora hay un x1 en la EXP.');
	}
}

module.exports = {
	top,
	pelea,
	c_prendio,
};