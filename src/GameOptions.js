// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const top = async (ctx) => {
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
	
	sql = `SELECT users.username, users.id, experiences.points, experiences.level, experiences.insults, experiences.aggressiveness, experiences.pateria
		FROM users
		INNER JOIN experiences ON users.id = experiences.user_id
		ORDER BY experiences.points DESC
		LIMIT 5`;

	let users = await client.query(sql);
	users = users.rows;

	let text = '|-------------------- *TOP 5* --------------------|\n';
	
	let i = 0;
	while (users[i]) {
		const user = users[i];
		
		const aggressiveness = Math.round10(user.aggressiveness, -2);
		const pato = Math.round10(user.pateria, -2);

		const damage_base = config.damage_base * user.level;
		const vida_base = config.vida_base * user.level;
		let damage = damage_base + ((damage_base * aggressiveness) / 100);
		damage = damage > 0 ? Math.round10(damage, -2) : 0;
		let vida = vida_base - ((vida_base * pato) / 100);
		vida = vida > 0 ? Math.round10(vida, -2) : 0;

		const xp_acumulada = config.xp_need - ((user.level * config.xp_need) - user.points);
		const porcentaje_alcandado = Math.round((100 * xp_acumulada) / config.xp_need);
		
		// NOTA(RECKER): Obtener batallas
		sql = `SELECT count(user_win) as count FROM fights WHERE user_win=$1`;
		let wins = await client.query(sql,[user.id]);
		wins = wins.rows[0];
		
		text += `*#${i+1} @${user.username}*\n`;
		text += `- Nivel: ${user.level} (${porcentaje_alcandado}%)\n`;
		text += `- Exp: ${user.points} pts\n`;
		text += `- Daño: ${damage}\n`;
		text += `- Vida: ${vida}\n`;
		text += `- Insultos: ${user.insults}\n`;
		text += `_- Agresividad: ${aggressiveness}%_\n`;
		text += `_- Cariñosidad: ${pato}%_\n`;
		text += `_- Batallas ganadas: ${wins.count}_\n`;
		if (users[i + 1]) {
			text = text + '\n\n';
		}
		i++;
	}

	let response = await ctx.replyWithMarkdown(text);
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
		ctx.deleteMessage(ctx.message_id);
	}, 20000);
	
	await client.end();
}

const c_prendio = async (ctx, double) => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = "SELECT * FROM config WHERE id=1";
	
	let config = await client.query(sql);
	config = config.rows[0];
	
	sql = "UPDATE config SET double_exp=$1 WHERE id=1";
	const res = await client.query(sql,[!config.double_exp]);
	
	if (!config.double_exp) {
		ctx.replyWithMarkdown(`*MODO AGRESIVIDAD ACTIVA.*\nAhora hay un x${double} en la EXP.`);
	}else {
		ctx.replyWithMarkdown('*Se acabó lo que se daba.*\nAhora hay un x1 en la EXP.');
	}
	
	ctx.deleteMessage(ctx.message_id);
	await client.end();
}

module.exports = {
	top,
	c_prendio,
};