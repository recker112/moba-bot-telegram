const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

// NOTA(RECKER): Botones
const buttons_init = Markup.inlineKeyboard([
	[
		Markup.button.callback('Top 1', 'season_top_1'),
		Markup.button.callback('Top 2', 'season_top_2'),
		Markup.button.callback('Top 3', 'season_top_3'),
	],
	[
		Markup.button.callback('Top 4', 'season_top_4'),
		Markup.button.callback('Top 5', 'season_top_5')
	],
	[Markup.button.callback('Cerrar', 'close')]
]);

let init_state = {
	buttons: buttons_init
}

const top = async (ctx) => {
	// Verificar redirección
	if (ctx.match && ctx.match[0] === 'season_top_1') {
		await top_callback(ctx, 0);
		return null;
	}else if (ctx.match && ctx.match[0] === 'season_top_2') {
		await top_callback(ctx, 1);
		return null;
	}else if (ctx.match && ctx.match[0] === 'season_top_3') {
		await top_callback(ctx, 2);
		return null;
	}else if (ctx.match && ctx.match[0] === 'season_top_4') {
		await top_callback(ctx, 3);
		return null;
	}else if (ctx.match && ctx.match[0] === 'season_top_5') {
		await top_callback(ctx, 4);
		return null;
	}
	
	// NOTA(RECKER): Obtener configuracion
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	// NOTA(RECKER): Config
	let sql = `SELECT * FROM configs WHERE id=1`;
	
	let config = await client.query(sql);
	config = config.rows[0];
	
	// NOTA(RECKER): User
	sql = `SELECT * FROM experiences 
INNER JOIN users ON users.id = experiences.user_id
INNER JOIN effects ON effects.user_id = experiences.user_id
ORDER BY experiences.points DESC LIMIT 1`;
	
	let user = await client.query(sql);
	user = user.rows[0];
	
	let stats = {
		vida_debuff: 0,
		damage_debuff: 0,
	};
	if (user) {
		// NOTA(RECKER): Debuffs
		sql = `SELECT type, amount FROM debuffs
	WHERE user_id=$1 AND expired_at > now() :: timestamp`;

		let debuffs = await client.query(sql,[user.user_id]);
		debuffs = debuffs.rows;

		// NOTA(RECKER): Obtener debuff
		debuffs.map((debuff) => {
			let keys = Object.keys(stats);
			keys.map((key) => {
				if (debuff.type === key) {
					stats[key] = stats[key] >= 75 ? 75 : stats[key] + debuff.amount;
				}
			});
		});
	}
	
	sql = `SELECT count(user_win) as count FROM fights WHERE user_win=$1`;
	let wins = await client.query(sql,[user.user_id]);
	wins = wins.rows[0];
	
	client.end();
	
	init_state.text = 'TOP 1:';
	
	if (user) {
		// NOTA(RECKER): Calculos
		let damage_base = config.damage_base * user.level;
		damage_base = damage_base - ((damage_base * stats.damage_debuff) / 100);
		let vida_base = config.vida_base * user.level;
		vida_base = vida_base - ((vida_base * stats.vida_debuff) / 100);

		let damage = damage_base + ((damage_base * user.aggressiveness) / 100);
		damage = Math.round10(damage, -2);
		let vida = vida_base - ((vida_base * user.smoothness) / 100) || 0;
		vida = vida > 0 ? Math.round10(vida, -2) : 0;

		const xp_acumulada = config.xp_need - ((user.level * config.xp_need) - user.points);
		const porcentaje_alcandado = Math.round((100 * xp_acumulada) / config.xp_need);
		
		init_state.text += `\n\nUsuario: @${user.username}
Nivel: ${user.level} (${porcentaje_alcandado}%)
EXP: ${user.points} pts
Daño: ${damage}
Vida: ${vida}
Palabras agresivas: ${user.insults}
Palabras cariñosas: ${user.blushed}
Peleas ganadas: ${wins.count}

ESTADOS:
Agresividad: ${user.aggressiveness}%
Cariñosidad: ${user.smoothness}%`
	}else {
		init_state.text += '\n\nNadie está en el top 1'
	}
	
	let response = await ctx.reply(init_state.text, {
		reply_markup: init_state.buttons.reply_markup,
	});
	
	// NOTA(RECKER): Guardar en session
	let copy = typeof ctx.session.querys !== 'object' ? [] : ctx.session.querys;
	ctx.session.querys = [
		...copy,
		{
			id: response.message_id,
			message_remove: [
				ctx.message_id || ctx.message.message_id
			]
		}
	];
}

const top_callback = async (ctx, offset) => {
	// NOTA(RECKER): Verificar que los querys sean un objeto
	if (typeof ctx.session.querys !== 'object') {
		return null;
	}
	
	// NOTA(RECKER): Buscar query
	let found_id = ctx.session.querys.findIndex((query) => query.id === ctx.update.callback_query.message.message_id)
	
	
	if (found_id <= -1) {
		ctx.answerCbQuery('Permiso denegado');
		return null;
	}
	
	// NOTA(RECKER): Obtener configuracion
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	// NOTA(RECKER): Config
	let sql = `SELECT * FROM configs WHERE id=1`;
	
	let config = await client.query(sql);
	config = config.rows[0];
	
	// NOTA(RECKER): User
	sql = `SELECT * FROM experiences 
INNER JOIN users ON users.id = experiences.user_id
INNER JOIN effects ON effects.user_id = experiences.user_id
ORDER BY points DESC LIMIT 1 OFFSET ${offset}`;
	
	let user = await client.query(sql);
	user = user.rows[0];
	
	let stats = {
		vida_debuff: 0,
		damage_debuff: 0,
	};
	if (user) {
		// NOTA(RECKER): Debuffs
		sql = `SELECT type, amount FROM debuffs
	WHERE user_id=$1 AND expired_at > now() :: timestamp`;

		let debuffs = await client.query(sql,[user.user_id]);
		debuffs = debuffs.rows;

		// NOTA(RECKER): Obtener debuff
		debuffs.map((debuff) => {
			let keys = Object.keys(stats);
			keys.map((key) => {
				if (debuff.type === key) {
					stats[key] = stats[key] >= 75 ? 75 : stats[key] + debuff.amount;
				}
			});
		});
	}
	
	sql = `SELECT count(user_win) as count FROM fights WHERE user_win=$1`;
	let wins = await client.query(sql,[user.user_id]);
	wins = wins.rows[0];
	
	client.end();
	
	init_state.text = `TOP ${offset + 1}:`;
	
	if (user) {
		// NOTA(RECKER): Calculos
		let damage_base = config.damage_base * user.level;
		damage_base = damage_base - ((damage_base * stats.damage_debuff) / 100);
		let vida_base = config.vida_base * user.level;
		vida_base = vida_base - ((vida_base * stats.vida_debuff) / 100);

		let damage = damage_base + ((damage_base * user.aggressiveness) / 100);
		damage = Math.round10(damage, -2);
		let vida = vida_base - ((vida_base * user.smoothness) / 100) || 0;
		vida = vida > 0 ? Math.round10(vida, -2) : 0;

		const xp_acumulada = config.xp_need - ((user.level * config.xp_need) - user.points);
		const porcentaje_alcandado = Math.round((100 * xp_acumulada) / config.xp_need);
		
		init_state.text += `\n\nUsuario: @${user.username}
Nivel: ${user.level} (${porcentaje_alcandado}%)
EXP: ${user.points} pts
Daño: ${damage}
Vida: ${vida}
Palabras agresivas: ${user.insults}
Palabras cariñosas: ${user.blushed}
Peleas ganadas: ${wins.count}

ESTADOS:
Agresividad: ${user.aggressiveness}%
Cariñosidad: ${user.smoothness}%`
	}else {
		init_state.text += `\n\nNadie está en el top ${offset + 1}`
	}
	
	try {
		let response = await ctx.editMessageText(init_state.text, {
			reply_markup: init_state.buttons.reply_markup,
		});
	} catch(e) {
		console.log('No changes message');
	}
}

const list_words2 = async (ctx) => {
	// NOTA(RECKER): Verificar que los querys sean un objeto
	if (typeof ctx.session.querys !== 'object') {
		return null;
	}
	
	// NOTA(RECKER): Buscar query
	let found_id = ctx.session.querys.findIndex((query) => query.id === ctx.update.callback_query.message.message_id)
	
	
	if (found_id <= -1) {
		ctx.answerCbQuery('Permiso denegado');
		return null;
	}
	
	// NOTA(RECKER): Obtener configuracion
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = 'SELECT * FROM words WHERE status=2';

	let words = await client.query(sql);
	words = words.rows;
	
	client.end();
	
	let wordsList = '';
	words.map(({ word, status }) => {
		wordsList = wordsList + `- ${word}\n`;
	})
	
	init_state.text = `Lista de palabras cariñosas:

${wordsList}`;
	
	try {
		let response = await ctx.editMessageText(init_state.text, {
			reply_markup: init_state.buttons.reply_markup,
		});
	} catch(e) {
		console.log('No changes message');
	}
}

module.exports = top;