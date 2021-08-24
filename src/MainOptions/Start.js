// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../DB');

// NOTA(RECKER): DB
const { start_db } = require('../DB');

// NOTA(RECKER): Botones
const { Markup } = require('telegraf');

const buttons = Markup.inlineKeyboard([
	[Markup.button.callback('Cerrar', 'close')],
]);

const start = async (ctx) => {
	const command_list = [
		{ command: '/install', description: 'Instala el bot en un chat' },
		{ command: '/reset', description: 'Reinicia el score de todos los jugadores' },
		{ command: '/help', description: 'Pide ayuda al bot' },
		{ command: '/codigo', description: 'Ver el código del bot' },
		{ command: '/registrar', description: 'Registrate para poder comenzar a jugar' },
		{ command: '/cuenta', description: 'Maneja diferentes opciones de tu cuenta' },
		{ command: '/settings', description: 'Configuraciones del sistema' },
		{ command: '/wordlist', description: 'Lista de palabras disponibles' },
		{ command: '/stats', description: 'Ve tus stats' },
		{ command: '/top', description: 'Ve los 5 mejores jugadores de esta season' },
		{ command: '/topseason', description: 'Ve el mejor de cada season' },
		{ command: '/fire', description: 'Multiplica la XP' },
		{ command: '/pelea', description: 'Pelea contra otro jugador' },
		{ command: '/golpelist', description: 'Lista de golpes disponibles' },
	];
	
	const client = new Client(options_db);
	
	await client.connect();
	
	// Verificar instalaci贸n de DB
	let configs;
	try {
		let sql = 'SELECT owner_id FROM configs WHERE id=1';

		configs = await client.query(sql);
		configs = configs.rows[0];
	} catch (e) {
		await start_db();
	}
	
	if (!configs) {
		sql = 'SELECT owner_id FROM configs WHERE id=1';

		configs = await client.query(sql);
		configs = configs.rows[0];
	}
	
	
	if (configs.owner_id === null) {
		sql = 'UPDATE configs SET owner_id=$1 WHERE id=1';

		await client.query(sql,[ctx.from.id]);
		configs.owner_id = ctx.from.id;
	}
	client.end();
	
	// NOTA(RECKER): Solo el owner
	if (configs.owner_id != ctx.from.id) {
		let response = await ctx.reply('Permiso denegado');
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message.message_id);
		}, 4000);
		return null;
	}
	
	// NOTA(RECKER): Setear comandos
	await ctx.setMyCommands(command_list);
	
	let response = await ctx.replyWithMarkdown(`|-------------- *MOBA RANK ${process.env.VERSION}* --------------|
Has iniciado el bot, con estos comandos puedes dar tus primeros pasos de configuración:
/install - Instala el bot en un chat
/settings - Configura el sistema
/fire - Agrega un multiplicador de xp
/reset - Reinicia scores y comienza una nueva season`, {
		reply_markup: buttons.reply_markup,
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

module.exports = {
	start,
}