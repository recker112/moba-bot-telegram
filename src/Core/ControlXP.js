// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const { init_state } = require('./Settings');
const { Markup } = require('telegraf');
const { removexp_awaitResponse } = require('./settings/RemoveXP');
const { addxp_awaitResponse } = require('./settings/AddXP');

// NOTA(RECKER): Botones
const buttons_controlXP = Markup.inlineKeyboard([
	[
		Markup.button.callback('Agregar xp', 'settings_control_xp_add'),
		Markup.button.callback('Remover xp', 'settings_control_xp_remove'),
	],
	[Markup.button.callback('Regresar', 'returns')]
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
	if (ctx.match[0] === 'settings_control_xp_add') {
		await addxp_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'settings_control_xp_remove') {
		await removexp_awaitResponse(ctx);
		return null;
	}
	
	init_state.text = `MOBA RANK ${process.env.VERSION}
Estas son las configuraciones disponibles para el sistema`;
	
	let response = await ctx.editMessageText('Aquí puede agregar o remover xp a uno o varios usuarios en específico, simplemente escoja una opción', {
		reply_markup: buttons_controlXP.reply_markup,
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