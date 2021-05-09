const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

// NOTA(RECKER): DB
const { start_db, down_db } = require('../DB');

const buttons = Markup.inlineKeyboard([
	[Markup.button.callback('Confirmar', 'confirm_reset'), Markup.button.callback('Cancelar', 'close')],
]);

const reset = async (ctx) => {
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
	
	await client.end();
	
	if (configs.owner_id != ctx.from.id) {
		let response = await ctx.reply('Solo el que inició el bot por primera vez puede realizar esta acción');
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message.message_id);
		}, 4000);
		return null;
	}
	
	let response = await ctx.replyWithMarkdown('*¿Esta seguro de hacer esto?*\nSe perderá todos los puntos acumulados hasta ahora y se seleccionará al ganador de esta season.', {
		reply_markup: buttons.reply_markup
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

const confirm_reset = async (ctx) => {
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
	let query = ctx.session.querys[found_id];
	
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
	
	await client.end();
	
	// NOTA(RECKER): Verificar owner
	if (configs.owner_id != ctx.from.id) {
		await ctx.answerCbQuery('Solo el que instaló el bot puede responder a esto');
		return null;
	}
	
	await down_db();
	
	await start_db();
	
	// Eliminar callback mesasage
	ctx.deleteMessage(query.id);
	
	// NOTA(RECKER): Eliminar mensajes
	query.message_remove && query.message_remove.map((id) => {
		ctx.deleteMessage(id);
	});
	
	// NOTA(RECKER): Eliminar query de la lista
	let copy = ctx.session.querys;
	copy.splice(found_id,1);
	
	ctx.session.querys = copy;
	
	ctx.reply('Puntos reiniciados.\n¡Nueva season comenzada!');
}

module.exports = {
	reset,
	confirm_reset,
};