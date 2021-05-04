// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

function getRandomInt(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}

const pelea = async (ctx) => {
	// NOTA(RECKER): Validad mencion
	if (ctx.message.entities.length !== 2) {
		let response = await ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /pelea @usuario');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id);
		}, 5000);
		return null;
	}
	
	if (ctx.message.entities[1].type !== 'mention') {
		let response = await ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /pelea @usuario');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id);
		}, 5000);
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
			ctx.deleteMessage(ctx.message_id);
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
	
	let sql = 'SELECT * FROM config WHERE id=1';
	
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
			ctx.deleteMessage(ctx.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener jugador 1
	sql = `SELECT users.*, experiences.* FROM users
INNER JOIN experiences ON users.id = experiences.user_id
WHERE users.id=$1`;
	
	let user1 = await client.query(sql, [ctx.from.id]);
	user1 = user1.rows[0];
	
	if (!user1) {
		let response = await ctx.replyWithMarkdown('Debes de registrarte primero\nUsa /help para más información');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Obtener jugador 2
	sql = `SELECT users.*, experiences.* FROM users
INNER JOIN experiences ON users.id = experiences.user_id
WHERE users.username=$1`;
	
	let user2 = await client.query(sql, [username.slice(1)]);
	user2 = user2.rows[0];
	
	if (!user2) {
		let response = await ctx.replyWithMarkdown('El usuario que está retando no se encuentra registrado');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	// NOTA(RECKER): Preparar usuarios con sus stats
	let users = [user1, user2];
	users = users.map((user) => {
		const aggressiveness = Math.round10(user.aggressiveness, -2);
		const pato = Math.round10(user.pateria, -2);

		const damage_base = config.damage_base * user.level;
		const vida_base = config.vida_base * user.level;
		let damage = damage_base + ((damage_base * aggressiveness) / 100);
		damage = damage > 0 ? Math.round10(damage, -2) : 0;
		let vida = vida_base - ((vida_base * pato) / 100);
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
		const randomNumber = getRandomInt(0,9);
		const randomNumberText = getRandomInt(0,golpes_type.length - 1);
		
		// NOTA(RECKER): Seleccionar usuarios
		let user_attack;
		let user_recived;
		if (randomNumber > 4) {
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
		
		
		// NOTA(RECKER): Mensajes especiales
		if ((users[0].vida <= 0 || users[1].vida <= 0) && round === 1) {
			// NOTA(RECKER): Deleteado
			fight_log += '\n*DELETEADO PAPÁ*';
		}
		
		round++;
	}
	
	let user_win;
	let user_lose;
	if (users[0].vida > 0) {
		user_win = users[0];
		user_lose = users[1];
	} else {
		user_win = users[1];
		user_lose = users[0];
	}
	
	fight_log += `\n\n*¡@${user_win.username} ganó la batalla!*`;
	
	ctx.replyWithMarkdown(fight_log);
	
	// NOTA(RECKER): Registrar batalla
	sql = `INSERT INTO fights (user_win,user_lose) VALUES ($1,$2)`;
	
	await client.query(sql, [user_win.user_id,user_lose.user_id]);
	
	// NOTA(RECKER): Agregar xp al winner
	user_win.points += 3;
	sql = `UPDATE experiences
		SET points=points+5, aggressiveness=CASE WHEN aggressiveness > 10 THEN aggressiveness - 10 ELSE 0 END, pateria=pateria+20
		WHERE user_id=$1`;
	
	await client.query(sql, [user_win.user_id]);
	
	// NOTA(RECKER): Agregar agresividad al perdedor
	sql = `UPDATE experiences
		SET aggressiveness=aggressiveness+20
		WHERE user_id=$1`;
	
	await client.query(sql, [user_lose.user_id]);
	
	// NOTA(RECKER): Aumentar nivel
	if (user_win.points >= (user_win.level * config.xp_need)) {
		user_win.level++;
		sql = `UPDATE experiences
		SET level=${user_win.level}
		WHERE user_id=$1`;
		
		await client.query(sql,[user_win.user_id]);
	}
	
	setTimeout(() => {
		ctx.deleteMessage(ctx.message_id);
	}, 5000);
	
	await client.end();
}

module.exports = {
	pelea
};