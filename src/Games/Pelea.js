// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const { calculate_level } = require('../Core/settings/AddXP');

function getRandomInt(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

const main = async (ctx, double) => {
	// NOTA(RECKER): Validar mencion
	if (ctx.message.entities.length !== 2) {
		let response = await ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /pelea @usuario');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 4000);
		return null;
	}
	
	if (ctx.message.entities[1].type !== 'mention') {
		let response = await ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /pelea @usuario');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 4000);
		return null;
	}
	const offset = ctx.message.entities[1].offset;
	const length = ctx.message.entities[1].length;
	
	let username = ctx.message.text.slice(offset, length + offset);
	
	// NOTA(RECKER): Evitar confrontamiento propio
	if (ctx.from.username === username.slice(1)) {
		let response = await ctx.replyWithMarkdown('No puedes pelear contra ese oponente');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 5000);
		return null;
	}
	
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
	
	// NOTA(RECKER): Obtener golpes_type
	sql = 'SELECT golpe FROM fight_golpes';
	
	let golpes_type = await client.query(sql);
	golpes_type = golpes_type.rows;
	
	if (!golpes_type.length) {
		let response = await ctx.replyWithMarkdown('No hay golpes registrados para poder iniciar una batalla');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener jugador 1
	sql = `SELECT * FROM users
INNER JOIN experiences ON users.id = experiences.user_id
INNER JOIN effects ON effects.user_id = users.id
WHERE users.id=$1`;
	
	let user1 = await client.query(sql, [ctx.from.id]);
	user1 = user1.rows[0];
	
	if (!user1) {
		let response = await ctx.replyWithMarkdown('Debes de registrarte primero\nUsa /help para más información');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener debuffs
	sql = `SELECT type, amount FROM debuffs
WHERE user_id=$1 AND expired_at > now() :: timestamp`;
	
	let debuffs = await client.query(sql,[ctx.from.id]);
	debuffs = debuffs.rows;
	
	// NOTA(RECKER): Asignar debuff
	let stats1 = {
		vida_debuff: 0,
		damage_debuff: 0,
		xp_debuff: 0,
	};
	
	debuffs.map((debuff) => {
		let keys = Object.keys(stats1);
		keys.map((key) => {
			if (debuff.type === key) {
				stats1[key] = stats1[key] >= 75 ? 75 : stats1[key] + debuff.amount;
			}
		});
	});
	
	// NOTA(RECKER): Obtener jugador 2
	sql = `SELECT * FROM users
INNER JOIN experiences ON users.id = experiences.user_id
INNER JOIN effects ON effects.user_id = users.id
WHERE users.username=$1`;
	
	let user2 = await client.query(sql, [username.slice(1)]);
	user2 = user2.rows[0];
	
	if (!user2) {
		let response = await ctx.replyWithMarkdown('El usuario que está retando no se encuentra registrado');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener debuffs
	sql = `SELECT type, amount FROM debuffs
WHERE user_id=$1 AND expired_at > now() :: timestamp`;
	
	debuffs = await client.query(sql,[user2.user_id]);
	debuffs = debuffs.rows;
	
	// NOTA(RECKER): Asignar debuff
	let stats2 = {
		vida_debuff: 0,
		damage_debuff: 0,
		xp_debuff: 0,
	};
	
	debuffs.map((debuff) => {
		let keys = Object.keys(stats2);
		keys.map((key) => {
			if (debuff.type === key) {
				stats2[key] = stats2[key] >= 75 ? 75 : stats2[key] + debuff.amount;
			}
		});
	});
	
	// NOTA(RECKER): Preparar usuarios con sus stats
	let users = [user1, user2];
	users = users.map((user, i) => {
		let debuff_add;
		
		if (i === 0) {
			debuff_add = stats1;
		}else {
			debuff_add = stats2;
		}
		user.xp_debuff = debuff_add.xp_debuff;
		
		// NOTA(RECKER): Calculos
		let damage_base = config.damage_base * user.level;
		damage_base = damage_base - ((damage_base * debuff_add.damage_debuff) / 100);
		let vida_base = config.vida_base * user.level;
		vida_base = vida_base - ((vida_base * debuff_add.vida_debuff) / 100);

		let damage = damage_base + ((damage_base * user.aggressiveness) / 100);
		damage = Math.round10(damage, -2);
		let vida = vida_base - ((vida_base * user.smoothness) / 100) || 0;
		vida = vida > 0 ? Math.round10(vida, -2) : 0;
		
		user.vida = vida;
		user.damage = damage;
		
		return user;
	});
	
	let fight_log = '';
	fight_log = `|--------- *BATALLA INICIADA* ---------|
@${ctx.from.username} VS ${username}\n\n`;
	
	let round = 1;
	while(users[0].vida > 0 && users[1].vida > 0) {
		const randomNumber = getRandomInt(0,99);
		const randomNumberText = getRandomInt(0,golpes_type.length - 1);
		
		// NOTA(RECKER): Seleccionar usuarios
		let user_attack;
		let user_recived;
		if (randomNumber > 49) {
			user_attack = users[0];
			user_recived = users[1];
		}else {
			user_attack = users[1];
			user_recived = users[0];
		}
		
		// NOTA(RECKER): Movimiento
		user_recived.vida -= user_attack.damage;
		user_recived.vida = Math.round10(user_recived.vida, -2);
		fight_log += `- @${user_attack.username} ${golpes_type[randomNumberText].golpe} @${user_recived.username} dejándolo con ${user_recived.vida}PS\n`;
		
		round++;
	}
	
	// NOTA(RECKER): Mensajes especiales
	if ((users[0].vida <= 0 || users[1].vida <= 0) && round === 1) {
		// NOTA(RECKER): No vida
		fight_log += '*Alguno de los jugadores no tienen vida suficiente para una batalla*';
	}else if ((users[0].vida <= 0 || users[1].vida <= 0) && round === 2) {
		// NOTA(RECKER): No vida
		fight_log += '\n*DELETEADO PAPÁ*';
	}
	
	// NOTA(RECKER): Asignar ganador
	let user_win;
	let user_lose;
	if (users[0].vida > 0 && users[1].vida <= 0) {
		user_win = users[0];
		user_lose = users[1];
	} else if (users[1].vida > 0 && users[0].vida <= 0) {
		user_win = users[1];
		user_lose = users[0];
	}else {
		user_win=null;
		user_lose=null;
	}
	
	if (user_win) {
		fight_log += `\n\n*¡@${user_win.username} ganó la batalla!*`;
		
			// NOTA(RECKER): Registrar batalla
		sql = `INSERT INTO fights (user_win,user_lose) VALUES ($1,$2)`;

		await client.query(sql, [user_win.user_id,user_lose.user_id]);
		
		// NOTA(RECKER): Agregar xp al winner
		let addxp_win = 10 * config.double_exp;
		user_win.points += addxp_win - ((user_win.xp_debuff * addxp_win) / 100) || 0;
		user_win.points = Math.round10(user_win.points, -2);
		// NOTA(RECKER): Aumentar nivel
		if (user_win.points >= (user_win.level * config.xp_need)) {
			let levels = calculate_level(user_win.points, config.xp_need);
			user_win.level = levels;
		}
		
		sql = 'UPDATE experiences SET points=$1, level=$2 WHERE user_id=$3';
		
		await client.query(sql, [user_win.points, user_win.level, user_win.user_id]);
		
		// NOTA(RECKER): Agregar efectos al winner
		sql = `UPDATE effects SET aggressiveness=CASE WHEN aggressiveness > 15 THEN aggressiveness - 15 ELSE 0 END, smoothness=CASE WHEN smoothness < 110 THEN smoothness + 30 ELSE 110 END WHERE user_id=$1`;
	
		await client.query(sql,[user_win.user_id]);
		
		// NOTA(RECKER): Agregar agresividad al perdedor
		sql = 'UPDATE effects SET aggressiveness=aggressiveness+20 WHERE user_id=$1';

		await client.query(sql, [user_lose.user_id]);
	}else {
		fight_log += `\n\n*¡Nadie ganó la batalla!*`;
	}
	
	// NOTA(RECKER): Eliminar mensaje del usuario
	ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
	
	// NOTA(RECKER): Enviar resultado
	ctx.replyWithMarkdown(fight_log);
	
	client.end();
}

module.exports = {
	main
};