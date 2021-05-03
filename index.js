// NOTA(RECKER): Importanciones
const mainOptions = require('./src/MainOptions');
const accountOptions = require('./src/AccountOptions');
const settings = require('./src/Settings');
const gameOptions = require('./src/GameOptions');
const gameCore = require('./src/GameCore');

// NOTA(RECKER): Iniciar variables
const dotenv = require('dotenv');
dotenv.config();

// NOTA(RECKER): DB
require('./src/DB');
const Database = require('sqlite-async');

require('./src/parseCeil');

const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// NOTA(RECKER): Configuraciones de puntos
const double = 4;
const vida = 20;
const damage = 5;

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
	gameOptions.pelea(ctx);
});

// NOTA(RECKER): Ver stats
bot.command('stats', async ctx => {
	// NOTA(RECKER): Solo por mensaje privado
	/*if (ctx.chat.type !== 'private') {
		return null;
	}*/
	accountOptions.stats(ctx, vida, damage);
});

// NOTA(RECKER): Top
bot.command('top', async ctx => {
	gameOptions.top(ctx, vida, damage);
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

// NOTA(RECKER): CORE POINTS
bot.on('message', async ctx => {
	// NOTA(RECKER): No contar puntos si no es el grupo definido
	if (ctx.chat.id !== -1001200393360) {
		return null;
	}
	gameCore.main(ctx, double);
});

bot.launch();