// NOTA(RECKER): Importanciones
const startOptions = require('./src/MainOptions/Start');
const setupOptions = require('./src/MainOptions/Setup');
const helpOptions = require('./src/MainOptions/Help');
const codigoOptions = require('./src/MainOptions/Codigo');
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
const controlGolpes = require('./src/Core/ControlGolpes');
const golpeList = require('./src/Core/GolpeList');
const pelea = require('./src/Games/Pelea');
const stats = require('./src/AccountOptions/Stats');
const invertXP = require('./src/AccountOptions/InvertXP');
const top = require('./src/Core/Top');
const topSeason = require('./src/Core/TopSeason');
const cprendio = require('./src/Core/CPrendio');
const resetOptions = require('./src/MainOptions/Reset');

// NOTA(RECKER): Iniciar variables
const dotenv = require('dotenv');
dotenv.config();

// NOTA(RECKER): DB
require('./src/DB');

require('./src/parseCeil');

const { Telegraf, Markup } = require('telegraf');
const PostgresSession = require('telegraf-postgres-session')

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const bot = new Telegraf(process.env.BOT_TOKEN);

// NOTA(RECKER): Configuraciones de puntos
process.env.VERSION = 'v2.0.5';
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

// NOTA(RECKER): Codigo
bot.command('codigo', codigoOptions);

// NOTA(RECKER): Control XP
bot.action(['settings_control_xp','settings_control_xp_add', 'settings_control_xp_remove'], controlXP);

// NOTA(RECKER): Control de configuraciones
bot.action(['settings_config', 'settings_vida_base', 'settings_damage_base', 'settings_xp_need', 'settings_smoothness', 'settings_aggressiveness'], controlConfig);

// NOTA(RECKER): Control de palabras
bot.action(['settings_words', 'settings_addword_1', 'settings_addword_2', 'settings_removeword'], controlWords);

// NOTA(RECKER): Control de golpes
bot.action(['settings_golpes', 'settings_addgolpe', 'settings_removegolpe'], controlGolpes);

// NOTA(RECKER): Ver lista de golpes
bot.command('golpelist', golpeList.main);

// NOTA(RECKER): Ver lista de palabras
bot.command('wordlist', wordList.main);

// NOTA(RECKER): Ver otra lista de palabras
bot.action(['list_words1', 'list_words2'], wordList.main);

// NOTA(RECKER): PELEA
bot.command('pelea', pelea.main);

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

// NOTA(RECKER): Regresar
bot.action('returns', returns);

// NOTA(RECKER): Cerrar mensaje
bot.action('close', close);

bot.on('text', gameText.main);

bot.on('message', gameOthers);

bot.launch();