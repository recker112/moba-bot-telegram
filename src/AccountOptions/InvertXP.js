const { Markup } = require('telegraf');
let { init_state } = require('./Cuenta');
const { xp_debuff_awaitResponse } = require('./invert_xp/XP');
const { vida_debuff_awaitResponse } = require('./invert_xp/Vida');
const { damage_debuff_awaitResponse } = require('./invert_xp/Damage');
const { delete_message_awaitResponse } = require('./invert_xp/DeleteMessage');
const { delete_message_random_awaitResponse } = require('./invert_xp/DeleteMessageRandom');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

// NOTA(RECKER): Botones
const buttons = Markup.inlineKeyboard([
	[
		Markup.button.callback('Gana menos XP / 60XP', 'invertxp_xpD'),
		Markup.button.callback('Menos vida base / 55XP', 'invertxp_vidaD'),
	],
	[Markup.button.callback('Menos daño base / 35XP', 'invertxp_damageD')],
	[Markup.button.callback('Eliminar siguiente mensaje / 120XP', 'invertxp_deleteMD')],
	[Markup.button.callback('Eliminar mensaje random / 140XP', 'invertxp_deleteMRD')],
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
	}else if (ctx.match[0] === 'invertxp_deleteMD') {
		await delete_message_awaitResponse(ctx);
		return null;
	}else if (ctx.match[0] === 'invertxp_deleteMRD') {
		await delete_message_random_awaitResponse(ctx);
		return null;
	}
	
	// NOTA(RECKER): Obtener datos de la db
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	// NOTA(RECKER): Obtener config
	let sql = 'SELECT * FROM users WHERE id=$1';

	let user = await client.query(sql,[ctx.from.id]);
	user = user.rows[0];
	
	let text = '¿En qué puedes invertir tu XP? En molestar a los demás.\nLa forma correcta de leer los botones es la siguiente: {Efecto} / {XP por cada punto o porcentaje}.\nTen en cuenta que la duración de un debuff solo es de 48h, después de haber transcurrido ese tiempo el debuff expirará.';
	
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