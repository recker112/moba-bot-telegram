const Database = require('sqlite-async');

const addword_soft = async (ctx) => {
	let entities = ctx.message.entities;

	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /addword_soft');
		return null;
	}
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = 'INSERT INTO words (word,status) VALUES (?,2)';
			
		const res = await db.run(sql, [word]);
		
		let response = await ctx.replyWithMarkdown('¡Palabra agregada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabra introducida ya se encuentra registrada, intente de nuevo.');;
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

const addword = async (ctx) => {
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /addword palabra');
		return null;
	}
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = 'INSERT INTO words (word,status) VALUES (?,1)';
			
		const res = await db.run(sql, [word]);
		
		let response = await ctx.replyWithMarkdown('¡Palabra agregada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabra introducida ya se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

const wordlist = async (ctx) => {
	const db = await Database.open('./moba.db');
	let sql = 'SELECT * FROM words';

	const words = await db.all(sql);
	
	let wordsList = '';
	words.map(({ word, status }) => {
		wordsList = wordsList + `- *${word}* ${status === 1 ? '_(AGRESIVA)_' : '_(CARIÑOSA)_'}\n`;
	})
	
	let response = await ctx.replyWithMarkdown(`Estas son las palabras registradas:\n
${wordsList}`);
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
	}, 10000);
}

const removeword = async (ctx) => {
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /removeword palabra');
		return null;
	}
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = 'DELETE FROM words WHERE word=?';
			
		const res = await db.run(sql, [word]);
		
		let response = await ctx.replyWithMarkdown('¡Palabra eliminada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabra introducida no se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

const addgolpe = async (ctx) => {
	let golpe = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!golpe.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /addgolpe palabra');
		return null;
	}
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = 'INSERT INTO fight_golpes (golpe) VALUES (?)';
			
		const res = await db.run(sql, [golpe]);
		
		let response = await ctx.replyWithMarkdown('¡Golpe agregado!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('El golpe introducido ya se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

const golpelist = async (ctx) => {
	const db = await Database.open('./moba.db');
	let sql = 'SELECT * FROM fight_golpes';

	const golpes = await db.all(sql);
	
	let golpeList = '';
	golpes.map(({ golpe }) => {
		golpeList += `- *${golpe}*\n`;
	});
	
	let response = await ctx.replyWithMarkdown(`Estos son los golpes registrados:\n
${golpeList}`);
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
	}, 10000);
}

const removegolpe = async (ctx) => {
	let golpe = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	if (!golpe.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /removegolpe palabra');
		return null;
	}
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = 'DELETE FROM fight_golpes WHERE golpe=?';
			
		const res = await db.run(sql, [golpe]);
		
		let response = await ctx.replyWithMarkdown('¡Golpe eliminado!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('El golpe introducido no se encuentra registrado, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

const calculate_level_up = (xp, xp_need) => {
	let level = 1;
	
	let cancel = true;
	while(cancel) {
		if (xp > (level * xp_need)) {
			level++;
		}else {
			cancel=false;
		}
	}
	
	return level;
}

const calculate_level_down = (xp, level_user, xp_need) => {
	let level = level_user;
	
	let cancel = true;
	while(cancel) {
		if (level > 0 && xp < (level * xp_need)) {
			level--;
		}else {
			cancel=false;
		}
	}
	
	return level;
}

const addxp = async (ctx) => {
	if (ctx.message.entities.length !== 2) {
		ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /addxp @usuario cantidad');
		return null;
	}
	
	const offset = ctx.message.entities[1].offset;
	const length = ctx.message.entities[1].length;
	
	let username = ctx.message.text.slice(offset, length + offset).slice(1);
	
	let add = ctx.message.text.slice(ctx.message.entities[1].offset + ctx.message.entities[1].length + 1);
	
	if (!add.length) {
		ctx.replyWithMarkdown('Debe de colocar una cantidad\nEJ: /addxp @usuario cantidad');
		return null;
	}
	add = parseInt(add);
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = `SELECT experiences.* FROM experiences 
INNER JOIN users ON experiences.user_id = users.id
WHERE users.username=?`;
			
		const user = await db.get(sql, [username]);
		
		if (!user) {
			throw new Error('No existente');
		}
		
		sql = `UPDATE experiences SET points=points+? 
WHERE user_id=?`;
			
		const res = await db.run(sql, [add,user.user_id]);
		
		user.points += add;
		
		sql = `SELECT * FROM config WHERE id=1`;
			
		const config = await db.get(sql);
		
		// NOTA(RECKER): Aumentar nivel
		let levels = calculate_level_up(user.points,config.xp_need);
		sql = `UPDATE experiences
		SET level=${levels}
		WHERE user_id=?`;
		
		await db.run(sql,[user.user_id]);
		
		let response = await ctx.replyWithMarkdown('¡Experiencia agregada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('Se produjo un error al intentar agregar xp al usuario.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

const removexp = async (ctx) => {
	if (ctx.message.entities.length !== 2) {
		ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /removexp @usuario cantidad');
		return null;
	}
	
	const offset = ctx.message.entities[1].offset;
	const length = ctx.message.entities[1].length;
	
	let username = ctx.message.text.slice(offset, length + offset).slice(1);
	
	let remove = ctx.message.text.slice(ctx.message.entities[1].offset + ctx.message.entities[1].length + 1);
	
	if (!remove.length) {
		ctx.replyWithMarkdown('Debe de colocar una cantidad\nEJ: /removexp @usuario cantidad');
		return null;
	}
	remove = parseInt(remove);
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = `SELECT experiences.* FROM experiences 
INNER JOIN users ON experiences.user_id = users.id
WHERE users.username=?`;
			
		const user = await db.get(sql, [username]);
		
		if (!user) {
			throw new Error('No existente');
		}
		
		sql = `UPDATE experiences SET points=CASE WHEN points > ? THEN points - ? ELSE 0 END
WHERE user_id=?`;
			
		const res = await db.run(sql, [remove,remove,user.user_id]);
		
		user.points -= remove;
		
		sql = `SELECT * FROM config WHERE id=1`;
			
		const config = await db.get(sql);
		
		// NOTA(RECKER): Quitar nivel
		let levels = calculate_level_down(user.points, user.level, config.xp_need);
		sql = `UPDATE experiences
		SET level=${levels}
		WHERE user_id=?`;

		await db.run(sql,[user.user_id]);
		
		let response = await ctx.replyWithMarkdown('¡Experiencia removida!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('Se produjo un error al intentar remover xp al usuario.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

module.exports = {
	addword_soft,
	addword,
	wordlist,
	removeword,
	addgolpe,
	golpelist,
	removegolpe,
	addxp,
	removexp,
};