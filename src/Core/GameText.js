// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { calculate_level } = require('./settings/AddXP');

const { removexp } = require('./settings/RemoveXP');
const { addxp } = require('./settings/AddXP');
const { vida_base } = require('./settings/VidaBase');
const { damage_base } = require('./settings/DamageBase');
const { xp_need } = require('./settings/XpNeed');
const { aggressiveness } = require('./settings/Aggressiveness');
const { smoothness } = require('./settings/Smoothness');
const { addword1 } = require('./settings/AddWords1');
const { addword2 } = require('./settings/AddWords2');
const { removeword } = require('./settings/RemoveWords');
const { addgolpe } = require('./settings/AddGolpe');
const { removegolpe } = require('./settings/RemoveGolpe');
const { xp_debuff } = require('../AccountOptions/invert_xp/XP');
const { vida_debuff } = require('../AccountOptions/invert_xp/Vida');
const { damage_debuff } = require('../AccountOptions/invert_xp/Damage');
const { delete_message } = require('../AccountOptions/invert_xp/DeleteMessage');
const { delete_message_random } = require('../AccountOptions/invert_xp/DeleteMessageRandom');

function getRandomInt(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

const awaitResponse = async (ctx) => {
	const awaitID = ctx.session.awaitID;
	const awaits = ctx.session.awaitResponse[awaitID];
	
	switch (awaits.type) {
		case 'removexp':
			await removexp(ctx);
			
			break;
			
		case 'addxp':
			await addxp(ctx);
			break;
			
		case 'vida_base':
			await vida_base(ctx);
			break;
			
		case 'damage_base':
			await damage_base(ctx);
			break;
			
		case 'xp_need':
			await xp_need(ctx);
			break;
			
		case 'aggressiveness':
			await aggressiveness(ctx);
			break;
			
		case 'smoothness':
			await smoothness(ctx);
			break;
			
		case 'addword1':
			await addword1(ctx);
			break;
			
		case 'addword2':
			await addword2(ctx);
			break;
			
		case 'removeword':
			await removeword(ctx);
			break;
			
		case 'addgolpe':
			await addgolpe(ctx);
			break;
			
		case 'removegolpe':
			await removegolpe(ctx);
			break;
			
		case 'xp_debuff':
			await xp_debuff(ctx);
			break;
			
		case 'vida_debuff':
			await vida_debuff(ctx);
			break;
			
		case 'damage_debuff':
			await damage_debuff(ctx);
			break;
			
		case 'delete_message':
			await delete_message(ctx);
			break;
			
		case 'delete_message_random':
			await delete_message_random(ctx);
			break;
			
		default:
			ctx.session.awaitResponse.splice(awaitID,1);
			ctx.session.awaitID = null;
	}
}

const gameText = async (ctx) => {
	// Verificar espera de respuesta
	if (typeof ctx.session.awaitID === 'number') {
		await awaitResponse(ctx);
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
	
	let sql = 'SELECT * FROM configs WHERE id=1';
	
	let config = await client.query(sql);
	config = config.rows[0];
	
	sql = 'SELECT * FROM experiences INNER JOIN effects ON effects.user_id = experiences.user_id WHERE experiences.user_id=$1';
	
	let user_data = await client.query(sql,[ctx.from.id]);
	user_data = user_data.rows[0];
	
	// NOTA(RECKER): No dar xp si no se ha instalado el juego
	if (config.chat_id != ctx.chat.id) {
		return null;
	}
	
	// NOTA(RECKER): No hacer nada si el usuario está registrado
	if (!user_data) {
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener xp debuff
	sql = `SELECT type, amount, username, debuffs.id FROM debuffs
INNER JOIN users ON users.id = debuffs.user_from
WHERE user_id=$1 AND expired_at > now() :: timestamp`;
	
	let debuffs = await client.query(sql,[ctx.from.id]);
	debuffs = debuffs.rows;
	
	let debuffs_actives = {
		xp_debuff: 0,
		delete_message: 0,
		delete_message_random: 0,
		user_from: {},
	};

	debuffs.map((debuff) => {
		let keys = Object.keys(debuffs_actives);
		keys.map((key) => {
			if (debuff.type === key) {
				debuffs_actives[key] += debuff.amount;
				
				// NOTA(RECKER): Obtener el username_from
				debuffs_actives.user_from[key] = !debuffs_actives.user_from[key] ? {
					username: debuff.username,
					id: debuff.id
				} : debuffs_actives.user_from[key];
			}
		});
	});
	
	// Aplicar debuffos especiales
	const random = getRandomInt(0,99);
	if (debuffs_actives.delete_message) {
		ctx.deleteMessage(ctx.message.message_id);
		ctx.reply(`@${debuffs_actives.user_from.delete_message.username} pagó para borrar este mensaje de @${ctx.from.username}`);
		
		// NOTA(RECKER): Obtener xp debuff
		sql = `UPDATE debuffs SET amount=amount-1 WHERE id=$1`;

		await client.query(sql,[debuffs_actives.user_from.delete_message.id]);
		return null;
	}else if (debuffs_actives.delete_message_random && random > 75) {
		ctx.deleteMessage(ctx.message.message_id);
		ctx.reply(`@${debuffs_actives.user_from.delete_message_random.username} pagó para borrar a lo random este mensaje de @${ctx.from.username}`);
		
		// NOTA(RECKER): Obtener xp debuff
		sql = `UPDATE debuffs SET amount=amount-1 WHERE id=$1`;

		await client.query(sql,[debuffs_actives.user_from.delete_message_random.id]);
		return null;
	}
	
	// NOTA(RECKER): Obtener menciones
	let mentions = ctx.message.entities || [];
	let findMention = 0;
	
	let users = mentions.map((mention) => {
		if (mention.type === 'mention') {
			const user = ctx.message.text.slice(mention.offset,mention.length).toString();
			
			if (user !== `@${ctx.from.username}`) {
				findMention = 1;
				return user;
			}
		}
		return null;
	});
	
	// NOTA(RECKER): Obtener respuestas
	let reply_to = ctx.message.reply_to_message;
	let findReply = 0;
	if (reply_to) {
		findReply = reply_to.from.username === ctx.from.username ? 0 : 1;
	}
	
	// NOTA(RECKER): Lista de palabras con efecto
	sql = 'SELECT * FROM words';
	let words = await client.query(sql);
	words = words.rows;
	
	let findWords = 0;
	let aggress_match_list = '';
	let smooth_match_list = '';
	const text = ctx.message.text;
	words.forEach(({ word, status }) => {
		if (status === 1) {
			aggress_match_list += `${word}|`;
		}else if (status === 2) {
			smooth_match_list += `${word}|`;
		}
	});
	aggress_match_list = aggress_match_list.slice(0,-1);
	smooth_match_list = smooth_match_list.slice(0,-1);
	
	// NOTA(RECKER): Buscar palabras con regex
	let aggress_match = 0;
	let smooth_match = 0;
	if (aggress_match_list.length) {
		const reg1 = new RegExp(`(${aggress_match_list})`,"gi");
		aggress_match = text.match(reg1) ? text.match(reg1).length : 0;
	}
	if (smooth_match_list.length) {
		const reg2 = new RegExp(`(${smooth_match_list})`,"gi");
		smooth_match = text.match(reg2) ? text.match(reg2).length : 0;
	}
	
	// NOTA(RECKER): Combos de effectos
	aggress_match = aggress_match > 10 ? 10 : aggress_match;
	const aggress_combo = aggress_match >= 2 ? (config.aggressiveness_aggregate * aggress_match) / 75 : 0;
	let aggress_aggregate = config.aggressiveness_aggregate + aggress_combo;
	const smooth_combo = smooth_match >= 2 ? (config.smoothness_aggregate * smooth_match) / 75 : 0;
	let smooth_aggregate = config.smoothness_aggregate + smooth_combo;
	let addxp_messages = 0;
	
	// NOTA(RECKER): Agregar agresividad si está mencionando o respondiento
	user_data.aggressiveness += (findMention || findReply) ? aggress_aggregate * 1.5 : 0;
	// NOTA(RECKER): Agregar agresividad si solamente dijo la palabra
	user_data.aggressiveness += (!findMention && !findReply) && aggress_match > 0 ? aggress_aggregate : 0;
	// NOTA(RECKER): Agregar xp agresividad
	addxp_messages += aggress_match > 0 ? (config.points_base * 2) * config.double_exp : 0;
	// NOTA(RECKER): Agregar palabras
	user_data.insults += aggress_match;
	
	// NOTA(RECKER): Agregar cariñosidad si está mencionando o respondiento
	user_data.smoothness += (findMention || findReply) ? Math.round10(smooth_aggregate * 1.6, -2) : 0;
	// NOTA(RECKER): Agregar cariñosidad si solamente dijo la palabra
	user_data.smoothness += (!findMention && !findReply) && smooth_match > 0 ? Math.round10(smooth_aggregate, -2) : 0;
	// NOTA(RECKER): Agregar xp cariñosidad
	addxp_messages += smooth_match > 0 ? (config.points_base * 2) * config.double_exp : 0;
	// NOTA(RECKER): Agregar palabras
	user_data.blushed += smooth_match;
	// NOTA(RECKER): No pasar de 110 la cariñosidad
	user_data.smoothness = user_data.smoothness <= 110 ? user_data.smoothness : 110;
	
	// NOTA(RECKER): Descontar efectos si no se ha dicho nada
	user_data.aggressiveness -= (aggress_match === 0) ? config.aggressiveness_discount : 0;
	user_data.aggressiveness = user_data.aggressiveness <= 0 ? 0 : user_data.aggressiveness;
	user_data.aggressiveness = Math.round10(user_data.aggressiveness, -2);
		
	user_data.smoothness -= (smooth_match === 0) ? config.smoothness_discount : 0;
	user_data.smoothness = user_data.smoothness <= 0 ? 0 : user_data.smoothness;
	user_data.smoothness = Math.round10(user_data.smoothness, -2);
	
	// NOTA(RECKER): Agregar xp base
	addxp_messages += config.points_base * config.double_exp;
	user_data.points += addxp_messages - (debuffs_actives.xp_debuff * addxp_messages) / 100 || 0;
	user_data.points = Math.round10(user_data.points, -2);
	
	// NOTA(RECKER): Aumentar nivel
	if (user_data.points >= (user_data.level * config.xp_need)) {
		let levels = calculate_level(user_data.points, config.xp_need);
		user_data.level = levels;
	}
	
	// NOTA(RECKER): Actualizar datos
	sql = `UPDATE experiences
		SET points=$1, insults=$2, blushed=$3, level=$5
		WHERE user_id=$4`;
	
	await client.query(sql,[user_data.points, user_data.insults, user_data.blushed, ctx.from.id, user_data.level]);
	
	sql = `UPDATE effects SET aggressiveness=$1, smoothness=$2 WHERE user_id=$3`;
	
	await client.query(sql,[user_data.aggressiveness, user_data.smoothness, ctx.from.id]);
	
	await client.end();
}

module.exports = {
	main: gameText,
	getRandomInt,
}