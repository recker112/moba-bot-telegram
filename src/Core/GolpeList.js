const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

// NOTA(RECKER): Botones
const buttons_init = Markup.inlineKeyboard([
	[
		Markup.button.callback('Cerrar', 'close')
	],
]);

let init_state = {
	buttons: buttons_init
}

const main = async (ctx) => {
	// NOTA(RECKER): Obtener configuracion
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = 'SELECT golpe FROM fight_golpes';

	let golpes = await client.query(sql);
	golpes = golpes.rows;
	
	let golpeList = '';
	golpes.map(({ golpe }) => {
		golpeList = golpeList + `- ${golpe}\n`;
	})
	
	init_state.text = `Lista de golpes:

${golpeList}`;
	
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

module.exports = {
	main,
}