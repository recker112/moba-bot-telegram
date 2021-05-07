const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

// NOTA(RECKER): Botones
const buttons_init = Markup.inlineKeyboard([
	[
		Markup.button.callback('Agresivas', 'list_words1'),
		Markup.button.callback('Cariñosas', 'list_words2'),
	],
	[
		Markup.button.callback('Cerrar', 'close')
	],
]);

let init_state = {
	buttons: buttons_init
}

const main = async (ctx) => {
	// Verificar redirección
	if (ctx.match && ctx.match[0] === 'list_words1') {
		await list_words1(ctx);
		return null;
	}else if (ctx.match && ctx.match[0] === 'list_words2') {
		await list_words2(ctx);
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
	
	let sql = 'SELECT * FROM words WHERE status=1';

	let words = await client.query(sql);
	words = words.rows;
	
	let wordsList = '';
	words.map(({ word, status }) => {
		wordsList = wordsList + `- ${word}\n`;
	})
	
	init_state.text = `Lista de palabras agresivas:

${wordsList}`;
	
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

const list_words1 = async (ctx) => {
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
	
	let sql = 'SELECT * FROM words WHERE status=1';

	let words = await client.query(sql);
	words = words.rows;
	
	client.end();
	
	let wordsList = '';
	words.map(({ word, status }) => {
		wordsList = wordsList + `- ${word}\n`;
	})
	
	init_state.text = `Lista de palabras agresivas:

${wordsList}`;
	
	let response = await ctx.editMessageText(init_state.text, {
		reply_markup: init_state.buttons.reply_markup,
	});
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
	
	let response = await ctx.editMessageText(init_state.text, {
		reply_markup: init_state.buttons.reply_markup,
	});
}

module.exports = {
	main,
	init_state,
}