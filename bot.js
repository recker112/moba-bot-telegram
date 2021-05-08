// NOTA(RECKER): Importanciones
const startOptions = require('./src/MainOptions/Start');
const setupOptions = require('./src/MainOptions/Setup');
const helpOptions = require('./src/MainOptions/Help');
const registrar = require('./src/AccountOptions/Registrar');
const cuentaOptions = require('./src/AccountOptions/Cuenta');
const close = require('./src/Close');
const returns = require('./src/Returns');
const gameText = require('./src/Core/GameText');
const gameOthers = require('./src/Core/GameOthers');
const settings = require('./src/Core/Settings');
const controlXP = require('./src/Core/ControlXP');
const controlConfig = require('./src/Core/ControlConfigs');
const controlWords = require('./src/Core/ControlWords');
const wordList = require('./src/Core/WordList');
const stats = require('./src/AccountOptions/Stats');
const invertXP = require('./src/AccountOptions/InvertXP');
const top = require('./src/Core/Top');
const topSeason = require('./src/Core/TopSeason');
const cprendio = require('./src/Core/CPrendio');
const duelo = require('./src/Games/Duelo');
const unirseDuelo = require('./src/Games/Duelo/Unirse');
const closeGame = require('./src/CloseGame');

const resetOptions = require('./src/MainOptions/Reset');
const mainOptions = require('./src/MainOptions');
const accountOptions = require('./src/AccountOptions');
///const settings = require('./src/Settings');
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
const PostgresSession = require('./telegraf-postgres');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const bot = new Telegraf(process.env.BOT_TOKEN);

// NOTA(RECKER): Configuraciones de puntos
process.env.VERSION = 'v2.0.0';
bot.use((new PostgresSession({
	connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
})).middleware());

bot.telegram.getMe().then((botInfo) => {
	bot.options.username = botInfo.username
})

bot.start(startOptions.start);

// NOTA(RECKER): Instalar en un chat
bot.command('install', setupOptions.install);

// NOTA(RECKER): Confimar instalacion
bot.action('confirm_install', setupOptions.confirm_install);

// NOTA(RECKER): Reset
bot.command('reset', resetOptions.reset);

// NOTA(RECKER): Confimar reset
bot.action('confirm_reset', resetOptions.confirm_reset);

// NOTA(RECKER): Configuraciones
bot.settings(settings.main);

// NOTA(RECKER): Ayuda
bot.help(helpOptions);

// NOTA(RECKER): Control XP
bot.action(['settings_control_xp','settings_control_xp_add', 'settings_control_xp_remove'], controlXP);

// NOTA(RECKER): Control de configuraciones
bot.action(['settings_config', 'settings_vida_base', 'settings_damage_base', 'settings_xp_need', 'settings_smoothness', 'settings_aggressiveness'], controlConfig);

// NOTA(RECKER): Control de palabras
bot.action(['settings_words', 'settings_addword_1', 'settings_addword_2', 'settings_removeword'], controlWords);

// NOTA(RECKER): Ver lista de palabras
bot.command('wordlist', wordList.main);

// NOTA(RECKER): Ver otra lista de palabras
bot.action(['list_words1', 'list_words2'], wordList.main);

// NOTA(RECKER): Registrar cuenta
bot.command('registrar', registrar);

// NOTA(RECKER): Administrar cuenta
bot.command('cuenta', cuentaOptions.cuenta);

// NOTA(RECKER): Confimar instalacion
bot.action('sync_account', cuentaOptions.sync_account);

// NOTA(RECKER): Invertir XP
bot.action(['invertxp', 'invertxp_xpD', 'invertxp_vidaD', 'invertxp_damageD', 'invertxp_deleteMD', 'invertxp_deleteMRD'], invertXP.main);

// NOTA(RECKER): Stats
bot.command('stats', stats.main);

// NOTA(RECKER): Ver otro stats
bot.action(['stats_main', 'stats_debuff', 'stats_history'], stats.main);

// NOTA(RECKER): Top
bot.command('top', top);

// NOTA(RECKER): Ver otros tops
bot.action(['season_top_1', 'season_top_2', 'season_top_3', 'season_top_4', 'season_top_5'], top);

// NOTA(RECKER): Top season
bot.command('topseason', topSeason);

// NOTA(RECKER): C prendio
bot.command('fire', cprendio);

// NOTA(RECKER): DUDUDUDUUDUDUDDU DUELO
bot.command('duelo', duelo)

// NOTA(RECKER): Duelo CORE
bot.action('game_duelo_unir', unirseDuelo);

// NOTA(RECKER): Regresar
bot.action('returns', returns);

// NOTA(RECKER): Cerrar mensaje
bot.action('close', close);

// NOTA(RECKER): Cerrar game
bot.action('close_game', closeGame);

bot.on('text', gameText.main);

bot.on('message', gameOthers);
/*

/*
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
	fight.pelea(ctx, double);
});

// NOTA(RECKER): Ver stats
bot.command('stats', async ctx => {
	// NOTA(RECKER): Solo por mensaje privado
	if (ctx.chat.type !== 'private') {
		return null;
	}
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
*/

bot.launch();