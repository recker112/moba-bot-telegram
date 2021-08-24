const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../DB');

// NOTA(RECKER): Botones
const buttons_init = Markup.inlineKeyboard([
	[
		Markup.button.callback('Ficha principal', 'stats_main'),
		Markup.button.callback('Debuffs', 'stats_debuff')
	],
	[
		Markup.button.callback('Historial de debufos', 'stats_history'),
		Markup.button.callback('Cerrar', 'close')
	]
]);

let init_state = {
	buttons: buttons_init
}

const main = async (ctx) => {
	// Verificar redirección
	if (ctx.match && ctx.match[0] === 'stats_main') {
		await stats_main(ctx);
		return null;
	}else if (ctx.match && ctx.match[0] === 'stats_debuff') {
		await stats_debuff(ctx);
		return null;
	}else if (ctx.match && ctx.match[0] === 'stats_history') {
		await stats_history(ctx);
		return null;
	}
	
	// NOTA(RECKER): Obtener configuracion
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = 'SELECT * FROM configs WHERE id=1';
	
	// NOTA(RECKER): Obtener datos necesarios
	let config = await client.query(sql);
	config = config.rows[0];
	
	sql = `SELECT * FROM experiences
INNER JOIN effects ON effects.user_id = experiences.user_id
WHERE experiences.user_id=$1`;
	
	let user = await client.query(sql,[ctx.from.id]);
	user = user.rows[0];
	
	sql = `SELECT type, amount FROM debuffs
WHERE user_id=$1 AND expired_at > now() :: timestamp`;
	
	let debuffs = await client.query(sql,[ctx.from.id]);
	debuffs = debuffs.rows;
	
	// NOTA(RECKER): Obtener debuff
	let stats = {
		vida_debuff: 0,
		damage_debuff: 0,
	};
	
	debuffs.map((debuff) => {
		let keys = Object.keys(stats);
		keys.map((key) => {
			if (debuff.type === key) {
				stats[key] = stats[key] >= 75 ? 75 : stats[key] + debuff.amount;
			}
		});
	});
	
	// NOTA(RECKER): Verificar existencia de cuenta
	if (!user) {
		let response = await ctx.reply('Debes de registrarte primero\nUsa /help para más ayuda.');
		ctx.deleteMessage(ctx.message.message_id);
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 4000);
		return null;
	}
	
	// NOTA(RECKER): Obtener batallas
	sql = `SELECT count(user_win) as count FROM fights WHERE user_win=$1`;
	let wins = await client.query(sql,[ctx.from.id]);
	wins = wins.rows[0];
	sql = `SELECT count(user_lose) as count FROM fights WHERE user_lose=$1`;
	let loses = await client.query(sql,[ctx.from.id]);
	loses = loses.rows[0];
	
	client.end();
	
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
	
	// NOTA(RECKER): Texto
	init_state.text = `Ficha de ${ctx.from.first_name} ${ctx.from.last_name}:
Nivel: ${user.level} (${porcentaje_alcandado}%)
EXP: ${user.points} pts
Daño: ${damage}
Vida: ${vida}
Palabras agresivas: ${user.insults}
Palabras cariñosas: ${user.blushed}

ESTADOS:
Agresividad: ${user.aggressiveness}%
Cariñosidad: ${user.smoothness}%

PELEAS:
Ganadas: ${wins.count}
Perdidas: ${loses.count}`;
	
	let response = await ctx.replyWithMarkdown(init_state.text, {
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

const stats_main = async (ctx) => {
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
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = 'SELECT * FROM configs WHERE id=1';
	
	// NOTA(RECKER): Obtener datos necesarios
	let config = await client.query(sql);
	config = config.rows[0];
	
	sql = `SELECT * FROM experiences
INNER JOIN effects ON effects.user_id = experiences.user_id
WHERE experiences.user_id=$1`;
	
	let user = await client.query(sql,[ctx.from.id]);
	user = user.rows[0];
	
	sql = `SELECT type, amount FROM debuffs
WHERE user_id=$1 AND expired_at > now() :: timestamp`;
	
	let debuffs = await client.query(sql,[ctx.from.id]);
	debuffs = debuffs.rows;
	
	// NOTA(RECKER): Obtener debuff
	let stats = {
		vida_debuff: 0,
		damage_debuff: 0,
	};
	
	debuffs.map((debuff) => {
		let keys = Object.keys(stats);
		keys.map((key) => {
			if (debuff.type === key) {
				stats[key] = stats[key] >= 75 ? 75 : stats[key] + debuff.amount;
			}
		});
	});
	
	// NOTA(RECKER): Obtener batallas
	sql = `SELECT count(user_win) as count FROM fights WHERE user_win=$1`;
	let wins = await client.query(sql,[ctx.from.id]);
	wins = wins.rows[0];
	sql = `SELECT count(user_lose) as count FROM fights WHERE user_lose=$1`;
	let loses = await client.query(sql,[ctx.from.id]);
	loses = loses.rows[0];
	
	client.end();
	
	// NOTA(RECKER): Calculos
	let damage_base = config.damage_base * user.level;
	damage_base = damage_base - ((damage_base * stats.damage_debuff) / 100);
	let vida_base = config.vida_base * user.level;
	vida_base = vida_base - ((vida_base * stats.vida_debuff) / 100);
	
	let damage = damage_base + ((damage_base * user.aggressiveness) / 100);
	damage = Math.round10(damage, -2);
	let vida = vida_base - ((vida_base * user.smoothness) / 100);
	vida = vida > 0 ? Math.round10(vida, -2) : 0;
	
	const xp_acumulada = config.xp_need - ((user.level * config.xp_need) - user.points);
	const porcentaje_alcandado = Math.round((100 * xp_acumulada) / config.xp_need);
	
	// NOTA(RECKER): Texto
	init_state.text = `Ficha de ${ctx.from.first_name} ${ctx.from.last_name}:
Nivel: ${user.level} (${porcentaje_alcandado}%)
EXP: ${user.points} pts
Daño: ${damage}
Vida: ${vida}
Palabras agresivas: ${user.insults}
Palabras cariñosas: ${user.blushed}

ESTADOS:
Agresividad: ${user.aggressiveness}%
Cariñosidad: ${user.smoothness}%

PELEAS:
Ganadas: ${wins.count}
Perdidas: ${loses.count}`;
	
	try {
		let response = await ctx.editMessageText(init_state.text, {
			reply_markup: init_state.buttons.reply_markup,
		});
	} catch(e) {
		console.log('No changes message');
	}
}

const stats_debuff = async (ctx) => {
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
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = `SELECT * FROM debuffs
WHERE user_id=$1 AND expired_at > now() :: timestamp`;
	
	let debuffs = await client.query(sql,[ctx.from.id]);
	debuffs = debuffs.rows;
	
	client.end();
	
	// NOTA(RECKER): Obtener debuff
	let stats = {
		xp_debuff: 0,
		vida_debuff: 0,
		damage_debuff: 0,
		delete_message: 0,
		delete_message_random: 0,
	};

	debuffs.map((debuff) => {
		let keys = Object.keys(stats);
		keys.map((key) => {
			if (debuff.type === key) {
				stats[key] += debuff.amount;
			}
		});
	});
	stats.xp_debuff = stats.xp_debuff > 75 ? 75 : stats.xp_debuff;
	stats.vida_debuff = stats.vida_debuff > 75 ? 75 : stats.vida_debuff;
	
	
	// NOTA(RECKER): Texto
	init_state.text = `Estados extras de ${ctx.from.first_name} ${ctx.from.last_name}:
XP debuff: -${stats.xp_debuff}%
Vida base debuff: -${stats.vida_debuff}%
Daño base debuff: -${stats.damage_debuff}%
Borrar siguiente mensaje: ${stats.delete_message}
Borrar mensaje random: ${stats.delete_message_random}`;
	
	try {
		let response = await ctx.editMessageText(init_state.text, {
			reply_markup: init_state.buttons.reply_markup,
		});
	} catch(e) {
		console.log('No changes message');
	}
}

const stats_history = async (ctx) => {
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
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = `SELECT users.username, debuffs.type, debuffs.xp_amount FROM debuffs
INNER JOIN users ON users.id = debuffs.user_from
WHERE user_id=$1 AND expired_at > now() :: timestamp
ORDER BY expired_at DESC
LIMIT 10`;
	
	let debuffs = await client.query(sql,[ctx.from.id]);
	debuffs = debuffs.rows;
	
	client.end();
	
	// NOTA(RECKER): Obtener debuff
	let debuff_text = {
		xp_debuff: 'debufo de xp',
		vida_debuff: 'debufo de xp',
		damage_debuff: 'debufo de daño',
		delete_message: 'debufo de borrar mensaje(s)',
		delete_message_random: 'debufo de borrar mensaje(s) random',
	};

	let debuff_history = '';
	debuffs.map((action, i) => {
		let keys = Object.keys(debuff_text);
		keys.map((key) => {
			if (action.type === key) {
				debuff_history += `- @${action.username} pagó ${action.xp_amount}XP para darte ${debuff_text[key]}.\n`;
			}
		});
	});
	if (debuff_history.length === 0) {
		debuff_history = 'Nadie te ha querido atacar';
	}
	
	// NOTA(RECKER): Texto
	init_state.text = `Historial de debufos de ${ctx.from.first_name} ${ctx.from.last_name} (Últimos 10):

${debuff_history}`;
	
	try {
		let response = await ctx.editMessageText(init_state.text, {
			reply_markup: init_state.buttons.reply_markup,
		});
	} catch(e) {
		console.log('No changes message');
	}
}

module.exports = {
	main,
}