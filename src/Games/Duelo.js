const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const PostgresSession = require('../../telegraf-postgres');

// NOTA(RECKER): Botones
const buttons_init = Markup.inlineKeyboard([
	[Markup.button.callback('Unirse', 'game_duelo_unir')],
	[Markup.button.callback('Cancelar', 'close_game')],
]);

let init_state = {
	buttons: buttons_init
}

const duelo = async (ctx) => {
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
		let response = await ctx.reply('Necesitas estar registrado para poder realizar un dudududududud DUELO');
		
		setTimeout(() => {
			ctx.deleteMessage(ctx.message.message_id);
			ctx.deleteMessage(response.message_id);
		}, 4000);
		return null;
	}
	
	init_state.text = `@${ctx.from.username} inició una partida`;
	
	let response = await ctx.replyWithMarkdown(init_state.text, {
		reply_markup: init_state.buttons.reply_markup,
	});
	
	const key_session_game = `game:${ctx.chat.id}:${response.message_id}`;
	
	const sessions = new PostgresSession({
		connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false
			}
	});
	
	sessions.saveSessionPostgress(key_session_game, {
		user_owner: ctx.from.id,
		user_invited: null,
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

module.exports = duelo;