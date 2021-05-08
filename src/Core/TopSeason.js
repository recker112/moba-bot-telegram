// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

// NOTA(RECKER): DB
const { start_db } = require('../DB');

// NOTA(RECKER): Botones
const { Markup } = require('telegraf');

const buttons = Markup.inlineKeyboard([
	[Markup.button.callback('Cerrar', 'close')],
]);

const top_season = async (ctx) => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	// NOTA(RECKER): Obtener top
	let sql = 'SELECT top_season.id, users.username FROM top_season INNER JOIN users ON users.id = top_season.user_id ORDER BY top_season.id DESC LIMIT 10';

	let top = await client.query(sql);
	top = top.rows;
	
	let text = `|-------------- *MOBA RANK ${process.env.VERSION}* --------------|
Mejores jugadores de cada Season:

*Season ${top.length + 1}:* (ACTUAL)\n`;
	top.map(({ id, username }) => {
		text += `*Season ${id}:* @${username ? username : 'NINGUNO'}.\n`;
	});
	
	let response = await ctx.replyWithMarkdown(text, {
		reply_markup: buttons.reply_markup,
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

module.exports = top_season