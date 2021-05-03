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

const cuenta = (ctx) => {
	console.log(ctx);
	ctx.replyWithMarkdown('MENU PARA ACTUALIZAR CUENTA');
}

const stats = async (ctx, vida, damage) => {
	const db = await Database.open('./moba.db');
	let sql = `SELECT * FROM experiences WHERE user_id=?`;

	const user = await db.get(sql,[ctx.from.id]);
	
	if (!user) {
		return null;
	}
	
	const nivel = Math.floor(user.points * 0.01) + 1;
	const restante_nivel = Math.floor(user.points * 0.01);
	const aggressiveness = Math.round10(user.aggressiveness, -2);
	const pato = Math.round10(user.pateria, -2);
	
	const damage_base = damage * nivel;
	const vida_base = vida * nivel;

	let text = `_Ficha de ${ctx.from.first_name} ${ctx.from.last_name}:_
_Daño: ${damage_base + ((damage_base * aggressiveness) / 100)}_
_Vida: ${vida_base - ((vida_base * pato) / 100)}_
_EXP: ${user.points} pts_
_Nivel: ${nivel}_
_Insultos: ${user.insults}_

*ESTADOS*
_Agresividad: ${aggressiveness}%_
_Cariñosidad: ${pato}%_`;

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