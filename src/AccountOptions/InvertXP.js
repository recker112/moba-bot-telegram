// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../DB');

const { Markup } = require('telegraf');
let { init_state } = require('./Cuenta');
const { xp_debuff_awaitResponse } = require('./invert_xp/XP');
const { vida_debuff_awaitResponse } = require('./invert_xp/Vida');
const { damage_debuff_awaitResponse } = require('./invert_xp/Damage');

// NOTA(RECKER): Botones
const buttons = Markup.inlineKeyboard([
	[
		Markup.button.callback('Gana menos XP / 37XP', 'invertxp_xpD'),
		Markup.button.callback('Menos vida base / 28XP', 'invertxp_vidaD'),
	],
	[Markup.button.callback('Menos daño base / 20XP', 'invertxp_damageD')],
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
	
	// Verificar redirección
	if (ctx.match[0] === 'invertxp_xpD') {
		await xp_debuff_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'invertxp_vidaD') {
		await vida_debuff_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'invertxp_damageD') {
		await damage_debuff_awaitResponse(ctx);
		return null;
	}
	
	// NOTA(RECKER): Obtener datos de la db
	const client = new Client(options_db);
	
	await client.connect();
	
	// NOTA(RECKER): Obtener config
	let sql = 'SELECT * FROM users WHERE id=$1';

	let user = await client.query(sql,[ctx.from.id]);
	user = user.rows[0];
	
	let text = '¿En qué puedes invertir tu XP? En molestar a los demás.\nLa forma correcta de leer los botones es la siguiente: {Efecto} / {XP por cada punto o porcentaje}.\nTen en cuenta que la duración de un debuff solo es de 30 días, después de haber transcurrido ese tiempo el debuff dejará de hacer efecto.';
	
	let response = await ctx.editMessageText(text, {
		reply_markup: buttons.reply_markup
	});
	
	init_state.text = `Bienvenido a tu cuenta ${ctx.from.first_name} ${ctx.from.last_name}
Aquí podrás hacer diferentes acciones, usa los botones de abajo para elegir una opción.

👇👇👇👇👇👇`;
	
	// NOTA(RECKER): Guardar en session
	let copy = typeof ctx.session.returns !== 'object' ? [] : ctx.session.returns;
	
	ctx.session.returns = [
		...copy,
		{
			id: response.message_id,
			init_state: init_state,
		}
	];
}

module.exports = {
	main,
}