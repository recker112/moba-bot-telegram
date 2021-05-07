const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

// NOTA(RECKER): Botones
const buttons_init = Markup.inlineKeyboard([
	[
		Markup.button.callback('Agregar/Remover xp', 'settings_control_xp'),
		Markup.button.callback('Configuraciones', 'settings_config'),
	],
	[
		Markup.button.callback('Eliminar datos sin uso', 'settings_datos'),
		Markup.button.callback('Configurar palabras', 'settings_words'),
	],
	[Markup.button.callback('Cerrar', 'close')],
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
	
	let sql = 'SELECT owner_id FROM configs WHERE id=1';
	
	let configs = await client.query(sql);
	configs = configs.rows[0];
	
	if (configs.owner_id != ctx.from.id) {
		let response = await ctx.reply('Solo el que iniciรณ el bot por primera vez puede realizar esta acciรณn');
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message.message_id);
		}, 4000);
		return null;
	}
	
	init_state.text = `MOBA RANK ${process.env.VERSION}
Estas son las configuraciones disponibles para el sistema`;
	
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
	init_state,
}