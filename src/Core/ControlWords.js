const { init_state } = require('./Settings');
const { Markup } = require('telegraf');
const { addword1_awaitResponse } = require('./settings/AddWords1');
const { addword2_awaitResponse } = require('./settings/AddWords2');
const { removeword_awaitResponse } = require('./settings/RemoveWords');

// NOTA(RECKER): Botones
const buttons_controlConfig = Markup.inlineKeyboard([
	[
		Markup.button.callback('Agregar palabra agresiva', 'settings_addword_1'),
		Markup.button.callback('Agregar palabra cariñosa', 'settings_addword_2'),
	],
	[
		Markup.button.callback('Eliminar palabras', 'settings_removeword'),
		Markup.button.callback('Regresar', 'returns')
	],
]);

const main = async (ctx) => {
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
	
	// Verificar redirección
	if (ctx.match[0] === 'settings_addword_1') {
		await addword1_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'settings_addword_2') {
		await addword2_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'settings_removeword') {
		await removeword_awaitResponse(ctx);
		return null;
	}
	
	init_state.text = `MOBA RANK ${process.env.VERSION}
Estas son las configuraciones disponibles para el sistema`;
	
	let response = await ctx.editMessageText('Aquí podrás controlar las palabras usadas en el sistema, simplemente eliga la opción que desea realizar.', {
		reply_markup: buttons_controlConfig.reply_markup,
	});
	
	// NOTA(RECKER): Guardar en session
	let copy = typeof ctx.session.returns !== 'object' ? [] : ctx.session.returns;
	
	ctx.session.returns = [
		...copy,
		{
			id: response.message_id,
			init_state,
		}
	];
}

module.exports = main;