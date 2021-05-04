const Database = require('sqlite-async');

const registrar = async (ctx) => {
	const db = await Database.open('./moba.db');

	let sql = 'SELECT * FROM users where id=?';

	const user = await db.get(sql,[ctx.from.id]);

	// NOTA(RECKER): Evitar el registro
	if (user) {
		return null;
	}

	sql = 'INSERT INTO users (id,username) VALUES (?,?)';
	const res = await db.run(sql,[ctx.from.id, ctx.from.username]);

	sql = 'INSERT INTO experiences (user_id) VALUES (?);'
	const res2 = await db.run(sql,[ctx.from.id]);
	ctx.reply(`@${ctx.from.username} se unió al campo de batalla`);
}

const cuenta = async (ctx) => {
	const db = await Database.open('./moba.db');

	let sql = 'SELECT * FROM users where id=?';

	const user = await db.get(sql,[ctx.from.id]);
	
	// NOTA(RECKER): Evitar el registro
	if (!user) {
		let response = await ctx.reply('No estás registrado aún');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 5000);
		return null;
	}
	
	const count = await ctx.answerCbQuery();
	console.log(count);
	
	ctx.replyWithMarkdown('MENU PARA ACTUALIZAR CUENTA');
}

const stats = async (ctx) => {
	const db = await Database.open('./moba.db');
	let sql = 'SELECT * FROM config WHERE id=1';
	
	// NOTA(RECKER): Obtener datos necesarios
	const config = await db.get(sql);
	
	sql = `SELECT * FROM experiences WHERE user_id=?`;

	const experiences = await db.get(sql,[ctx.from.id]);
	
	if (!experiences) {
		return null;
	}
	
	// NOTA(RECKER): Obtener batallas
	sql = `SELECT count(user_win) as count FROM fights WHERE user_win=?`;
	const wins = await db.get(sql,[ctx.from.id]);
	sql = `SELECT count(user_lose) as count FROM fights WHERE user_lose=?`;
	const loses = await db.get(sql,[ctx.from.id]);
	
	// NOTA(RECKER): Calculos
	const aggressiveness = Math.round10(experiences.aggressiveness, -2);
	const pato = Math.round10(experiences.pateria, -2);
	
	const damage_base = config.damage_base * experiences.level;
	const vida_base = config.vida_base * experiences.level;
	let damage = damage_base + ((damage_base * aggressiveness) / 100);
	damage = damage > 0 ? Math.round10(damage, -2) : 0;
	let vida = vida_base - ((vida_base * pato) / 100);
	vida = vida > 0 ? Math.round10(vida, -2) : 0;
	
	const xp_acumulada = config.xp_need - ((experiences.level * config.xp_need) - experiences.points);
	const porcentaje_alcandado = Math.round((100 * xp_acumulada) / config.xp_need);

	let text = `_Ficha de ${ctx.from.first_name} ${ctx.from.last_name}:_
_Nivel: ${experiences.level} (${porcentaje_alcandado}%)_
_EXP: ${experiences.points} pts_
_Daño: ${damage}_
_Vida: ${vida}_
_Insultos: ${experiences.insults}_

*ESTADOS*
_Agresividad: ${aggressiveness}%_
_Cariñosidad: ${pato}%_

*BATALLAS*
_Ganadas: ${wins.count}_
_Perdidas: ${loses.count}_`;

	let response = await ctx.replyWithMarkdown(text);
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
	}, 20000);
}

module.exports = {
	registrar,
	cuenta,
	stats,
};