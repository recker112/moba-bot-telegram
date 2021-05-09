// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const { init_state } = require('./Settings');
const { Markup } = require('telegraf');
const { addgolpe_awaitResponse } = require('./settings/AddGolpe');
const { removegolpe_awaitResponse } = require('./settings/RemoveGolpe');

// NOTA(RECKER): Botones
const buttons_controlConfig = Markup.inlineKeyboard([
	[
		Markup.button.callback('Agregar golpe', 'settings_addgolpe'),
		Markup.button.callback('Eliminar golpe', 'settings_removegolpe'),
	],
	[
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
	if (ctx.match[0] === 'settings_addgolpe') {
		await addgolpe_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'settings_removegolpe') {
		await removegolpe_awaitResponse(ctx);
		return null;
	}
	
	init_state.text = `MOBA RANK ${process.env.VERSION}
Estas son las configuraciones disponibles para el sistema`;
	
	let response = await ctx.editMessageText('Aquí podrás controlar los golpes usados en el sistema, simplemente eliga la opción que desea realizar.', {
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