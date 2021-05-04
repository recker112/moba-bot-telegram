// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const registrar = async (ctx) => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();

	let sql = 'SELECT * FROM users where id=$1';

	let user = await client.query(sql,[ctx.from.id]);
	user = user.rows[0];

	// NOTA(RECKER): Evitar el registro
	if (user) {
		let response = await ctx.reply('Ya estás registrado');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	sql = 'INSERT INTO users (id,username) VALUES ($1,$2)';
	const res = await client.query(sql,[ctx.from.id, ctx.from.username]);

	sql = 'INSERT INTO experiences (user_id) VALUES ($1);'
	const res2 = await client.query(sql,[ctx.from.id]);
	
	ctx.reply(`@${ctx.from.username} se unió al campo de batalla`);
	await client.end();
}

const cuenta = async (ctx) => {
	/*const db = await Database.open('./moba.db');

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
	console.log(count);*/
	
	ctx.replyWithMarkdown('MENU PARA ACTUALIZAR CUENTA');
}

const stats = async (ctx) => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = 'SELECT * FROM config WHERE id=1';
	
	// NOTA(RECKER): Obtener datos necesarios
	let config = await client.query(sql);
	config = config.rows[0];
	
	sql = `SELECT * FROM experiences WHERE user_id=$1`;

	let experiences = await client.query(sql,[ctx.from.id]);
	experiences = experiences.rows[0];
	
	if (!experiences) {
		let response = await ctx.replyWithMarkdown('Debes de registrarte primero\nUsa /help para más información');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener batallas
	sql = `SELECT count(user_win) as count FROM fights WHERE user_win=$1`;
	let wins = await client.query(sql,[ctx.from.id]);
	wins = wins.rows[0];
	sql = `SELECT count(user_lose) as count FROM fights WHERE user_lose=$1`;
	let loses = await client.query(sql,[ctx.from.id]);
	loses = loses.rows[0];
	
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
	
	await client.end();
}

module.exports = {
	registrar,
	cuenta,
	stats,
};