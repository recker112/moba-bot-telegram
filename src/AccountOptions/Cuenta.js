const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

// NOTA(RECKER): Botones
const buttons_init = Markup.inlineKeyboard([
	[
		Markup.button.callback('Invertir XP', 'invertxp'),
		Markup.button.callback('Sincronizar cuenta', 'sync_account')
	],
	[Markup.button.callback('Cerrar', 'close')]
]);

let init_state = {
	buttons: buttons_init
}

const cuenta = async (ctx) => {
	// NOTA(RECKER): Obtener configuracion
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = 'SELECT * FROM experiences WHERE user_id=$1';
	
	let user = await client.query(sql,[ctx.from.id]);
	user = user.rows[0];
	
	await client.end();
	
	// NOTA(RECKER): Verificar existencia de cuenta
	if (!user) {
		let response = await ctx.reply('Tu cuenta no existe');
		ctx.deleteMessage(ctx.message.message_id);
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 4000);
		return null;
	}
	
	init_state.text = `Bienvenido a tu cuenta ${ctx.from.first_name} ${ctx.from.last_name}
Aquí podrás hacer diferentes acciones, usa los botones de abajo para elegir una opción.

👇👇👇👇👇👇`;
	
	let response = await ctx.replyWithMarkdown(init_state.text, {
		reply_markup: init_state.buttons.reply_markup,
	})
	
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

const sync_account = async (ctx) => {
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
	
	let text = '';
	if (user.username !== ctx.from.username) {
		 sql = 'UPDATE users SET username=$1 WHERE id=$2';

		await client.query(sql,[ctx.from.username, ctx.from.id]);
		
		text = `Sincronización de cuenta terminada, tu nuevo usuario ahora es ${ctx.from.username}.`
	}else {
		text = `No se han observado cambios en tu cuenta.`
	}
	
	// NOTA(RECKER): Botones
	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback('Regresar', 'returns')]
	]);
	
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
	cuenta,
	sync_account,
	init_state,
}