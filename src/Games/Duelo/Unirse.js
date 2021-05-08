const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const PostgresSession = require('../../../telegraf-postgres');

const unirse = async (ctx) => {
	// NOTA(RECKER): Obtener info de la partida
	const key = `game:${ctx.chat.id}:${ctx.update.callback_query.message.message_id}`;
	
	const sessions = new PostgresSession({
		connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false
			}
	});
	
	let gameInfo = await sessions.getSessionPostgres(key, false);
	
	if (gameInfo.user_invited !== null) {
		ctx.answerCbQuery('Ya hay dos personas jugando');
		return null;
	}
	
	await sessions.saveSessionPostgress(key, {
		user_owner: gameInfo.user_owner,
		user_invited: ctx.from.id,
	});
	
	ctx.answerCbQuery('Te uniste a la partida');
	
	console.log(gameInfo);
	let text = `¿Cómo jugar?
El Jugador 1 debe de esconder la bola en alguno de los cuadros mostrados en pantalla, una vez escoja un cuadro, el jugador 2 tendrá que encontrarlo, si lo encuentra el jugador 2 gana.`
	
	// NOTA(RECKER): Botones
	const buttons = Markup.inlineKeyboard([
		[Markup.button.callback('OK', 'game_duelo_ok')]
	]);
	
	let response = await ctx.editMessageText(text, {
		reply_markup: buttons.reply_markup
	});
	return null;
	
	/*
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
	*/
}

module.exports = unirse;