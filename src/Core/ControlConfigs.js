const { init_state } = require('./Settings');
const { Markup } = require('telegraf');
const { vida_base_awaitResponse } = require('./settings/VidaBase');
const { damage_base_awaitResponse } = require('./settings/DamageBase');
const { xp_need_awaitResponse } = require('./settings/XpNeed');
const { aggressiveness_awaitResponse } = require('./settings/Aggressiveness');
const { smoothness_awaitResponse } = require('./settings/Smoothness');

// NOTA(RECKER): Botones
const buttons_controlConfig = Markup.inlineKeyboard([
	[
		Markup.button.callback('Vida base', 'settings_vida_base'),
		Markup.button.callback('Daño base', 'settings_damage_base'),
	],
	[
		Markup.button.callback('XP para siguiente nivel', 'settings_xp_need'),
		Markup.button.callback('Agresividad', 'settings_aggressiveness'),
	],
	[
		Markup.button.callback('Cariñosidad', 'settings_smoothness'),
		Markup.button.callback('Regresar', 'returns')
	]
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
	if (ctx.match[0] === 'settings_vida_base') {
		await vida_base_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'settings_damage_base') {
		await damage_base_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'settings_xp_need') {
		await xp_need_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'settings_aggressiveness') {
		await aggressiveness_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'settings_smoothness') {
		await smoothness_awaitResponse(ctx);
		return null;
	}
	
	init_state.text = `MOBA RANK ${process.env.VERSION}
Estas son las configuraciones disponibles para el sistema`;
	
	let response = await ctx.editMessageText('Aquí puede adaptar el sistema a su gusto, simplemente eliga la configuración que desea cambiar.', {
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