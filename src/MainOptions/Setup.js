const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const buttons = Markup.inlineKeyboard([
	[Markup.button.callback('Confirmar', 'confirm_install'), Markup.button.callback('Cancelar', 'close')],
]);

const install = async (ctx) => {
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
	
	await client.end();
	
	if (configs.owner_id != ctx.from.id) {
		let response = await ctx.reply('Solo el que inició el bot por primera vez puede realizar esta acción');
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message.message_id);
		}, 4000);
		return null;
	}
	
	if (ctx.message.chat.type !== 'supergroup') {
		let response = await ctx.reply('Solo puede usar este comando en un grupo');
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message.message_id);
		}, 4000);
		return null;
	}
	
	let response = await ctx.replyWithMarkdown(`*¿Quiere instalar el chat de juego en ${ctx.message.chat.title}?*`, {
		reply_markup: buttons.reply_markup,
	});
	
	
	// NOTA(RECKER): Guardar en session
	let copy = typeof ctx.session.querys !== 'object' ? [] : ctx.session.querys;
	ctx.session.querys = [
		...copy,
		{
			id: response.message_id,
			chat_id: ctx.message.chat.id,
			message_remove: [
				ctx.message_id || ctx.message.message_id
			]
		}
	];
}

const confirm_install = async (ctx) => {
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
	
	// NOTA(RECKER): Obtener config
	let sql = 'SELECT owner_id, chat_id FROM configs WHERE id=1';

	let configs = await client.query(sql);
	configs = configs.rows[0];
	
	if (configs.chat_id == query.chat_id) {
		await ctx.answerCbQuery('Ya está instalado en este grupo');
		return null;
	}
	
	// NOTA(RECKER): Verificar owner
	if (configs.owner_id != ctx.from.id) {
		await ctx.answerCbQuery('No eres el jefe del bot');
		return null;
	}
	
	// NOTA(RECKER): Actualizar chat_id
	sql = 'UPDATE configs SET chat_id=$1 WHERE id=1';

	const res = await client.query(sql,[query.chat_id]);
	
	await client.end();
	
	// NOTA(RECKER): Eliminar mensaje de callback
	ctx.deleteMessage(query.id);
	
	// NOTA(RECKER): Eliminar mensajes
	query.message_remove && query.message_remove.map((id) => {
		ctx.deleteMessage(id);
	});
	
	// NOTA(RECKER): Eliminar query de la lista
	let copy = ctx.session.querys;
	copy.splice(found_id,1);
	
	ctx.session.querys = copy;
	
	ctx.replyWithMarkdown(`|---------- *MOBA RANK ${process.env.VERSION} INSTALADO* ----------|
Para más ayuda utiliza /help.`);
}

module.exports = {
	install,
	confirm_install,
}