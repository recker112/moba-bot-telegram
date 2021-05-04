// NOTA(RECKER): Importanciones
const mainOptions = require('./src/MainOptions');
const accountOptions = require('./src/AccountOptions');
const settings = require('./src/Settings');
const gameOptions = require('./src/GameOptions');
const gameCore = require('./src/GameCore');
const fight = require('./src/Fight');

// NOTA(RECKER): Iniciar variables
const dotenv = require('dotenv');
dotenv.config();

// NOTA(RECKER): DB
require('./src/DB');

require('./src/parseCeil');

const { Telegraf, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// NOTA(RECKER): Configuraciones de puntos
const double = 4;

bot.telegram.getMe().then((botInfo) => {
	bot.options.username = botInfo.username
})

bot.start(ctx => {
	mainOptions.start(ctx);
});

bot.help(ctx => {
	mainOptions.help(ctx);
});

bot.settings(ctx => {
	mainOptions.settings(ctx);
});

// NOTA(RECKER): Registrar cuenta
bot.command('registrar', async ctx => {
	accountOptions.registrar(ctx);
});

// NOTA(RECKER): Prender el carro manual
bot.command('c_prendio', async ctx => {
	gameOptions.c_prendio(ctx, double);
});

// NOTA(RECKER): Update
bot.command('cuenta', async ctx => {
	accountOptions.cuenta(ctx);
});

// NOTA(RECKER): Pelea
bot.command('pelea', async (ctx) => {
	fight.pelea(ctx);
});

// NOTA(RECKER): Ver stats
bot.command('stats', async ctx => {
	// NOTA(RECKER): Solo por mensaje privado
	/*if (ctx.chat.type !== 'private') {
		return null;
	}*/
	accountOptions.stats(ctx);
});

// NOTA(RECKER): Top
bot.command('top', async ctx => {
	gameOptions.top(ctx);
});

// NOTA(RECKER): Agregar palabras lite
bot.command('addword_soft', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	settings.addword_soft(ctx);
});

// NOTA(RECKER): Agregar palabras
bot.command('addword', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	settings.addword(ctx);
});

// NOTA(RECKER): Listar palabras
bot.command('wordlist', async ctx => {
	settings.wordlist(ctx);
});

// NOTA(RECKER): Eliminar palabras
bot.command('removeword', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	settings.removeword(ctx);
});

// NOTA(RECKER): Agregar golpe
bot.command('addgolpe', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	settings.addgolpe(ctx);
});

// NOTA(RECKER): Listar golpess
bot.command('golpelist', async ctx => {
	settings.golpelist(ctx);
});

// NOTA(RECKER): Eliminar golpes
bot.command('removegolpe', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	settings.removegolpe(ctx);
});

// NOTA(RECKER): Añadir xp
bot.command('addxp', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	settings.addxp(ctx);
});

// NOTA(RECKER): Quitar xp
bot.command('removexp', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	settings.removexp(ctx);
});

// NOTA(RECKER): CORE POINTS
bot.on('message', async ctx => {
	gameCore.main(ctx, double);
});

bot.launch();