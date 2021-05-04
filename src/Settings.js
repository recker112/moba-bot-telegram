// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const addword_soft = async (ctx) => {
	let entities = ctx.message.entities;
	
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!word.length) {
		let response = await ctx.reply('Debe de colocar una palabra\nEJ: /addword_soft palabra');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
		return null;
	}
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	try {
		let sql = 'INSERT INTO words (word,status) VALUES ($1,2)';
			
		const res = await client.query(sql, [word]);
		
		let response = await ctx.replyWithMarkdown('¡Palabra agregada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabra introducida ya se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}
	await client.end();
}

const addword = async (ctx) => {
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!word.length) {
		let response = await ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /addword palabra');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
		return null;
	}
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	try {
		let sql = 'INSERT INTO words (word,status) VALUES ($1,1)';
			
		const res = await client.query(sql, [word]);
		
		let response = await ctx.replyWithMarkdown('¡Palabra agregada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabra introducida ya se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}
	
	await client.end()
}

const wordlist = async (ctx) => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = 'SELECT * FROM words';

	let words = await client.query(sql);
	words = words.rows;
	
	let wordsList = '';
	words.map(({ word, status }) => {
		wordsList = wordsList + `- *${word}* ${status === 1 ? '_(AGRESIVA)_' : '_(CARIÑOSA)_'}\n`;
	})
	
	let response = await ctx.replyWithMarkdown(`Estas son las palabras registradas:\n
${wordsList}`);
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
		ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
	}, 10000);
	
	await client.end();
}

const removeword = async (ctx) => {
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	if (!word.length) {
		let response = await ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /removeword palabra');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
		return null;
	}
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	try {
		let sql = 'DELETE FROM words WHERE word=$1';
			
		const res = await client.query(sql, [word]);
		
		if (!res.rowCount) {
			throw new Error('No register');
		}
		
		let response = await ctx.replyWithMarkdown('¡Palabra eliminada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabra introducida no se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}
	
	await client.end();
}

const addgolpe = async (ctx) => {
	let golpe = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!golpe.length) {
		let response =  await ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /addgolpe palabra');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
		return null;
	}
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	try {
		let sql = 'INSERT INTO fight_golpes (golpe) VALUES ($1)';
			
		const res = await client.query(sql, [golpe]);
		
		let response = await ctx.replyWithMarkdown('¡Golpe agregado!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('El golpe introducido ya se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}
	
	await client.end();
}

const golpelist = async (ctx) => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = 'SELECT * FROM fight_golpes';

	let golpes = await client.query(sql);
	golpes = golpes.rows;
	
	let golpeList = '';
	golpes.map(({ golpe }) => {
		golpeList += `- *${golpe}*\n`;
	});
	
	let response = await ctx.replyWithMarkdown(`Estos son los golpes registrados:\n
${golpeList}`);
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
		ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
	}, 10000);
	
	await client.end();
}

const removegolpe = async (ctx) => {
	let golpe = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	if (!golpe.length) {
		let response = await ctx.replyWithMarkdown('Debe de colocar una palabra\nEJ: /removegolpe palabra');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
		return null;
	}
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	try {
		let sql = 'DELETE FROM fight_golpes WHERE golpe=$1';
			
		const res = await client.query(sql, [golpe]);
		
		if (!res.rowCount) {
			throw new Error('No register');
		}
		
		let response = await ctx.replyWithMarkdown('¡Golpe eliminado!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('El golpe introducido no se encuentra registrado, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}
	
	await client.end();
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
		if (level > 1 && xp < (level * xp_need)) {
			level--;
		}else {
			cancel=false;
		}
	}
	
	return level;
}

const addxp = async (ctx) => {
	if (ctx.message.entities.length !== 2) {
		let response = await ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /addxp @usuario cantidad');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
		return null;
	}
	
	const offset = ctx.message.entities[1].offset;
	const length = ctx.message.entities[1].length;
	
	let username = ctx.message.text.slice(offset, length + offset).slice(1);
	
	let add = ctx.message.text.slice(ctx.message.entities[1].offset + ctx.message.entities[1].length + 1);
	
	if (!add.length) {
		ctx.replyWithMarkdown('Debe de colocar una cantidad\nEJ: /addxp @usuario cantidad');
		ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		return null;
	}
	add = parseInt(add);
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	try {
		let sql = `SELECT experiences.* FROM experiences 
INNER JOIN users ON experiences.user_id = users.id
WHERE users.username=$1`;
			
		let user = await client.query(sql, [username]);
		user = user.rows[0];
		
		if (!user) {
			throw new Error('No existente');
		}
		
		sql = `UPDATE experiences SET points=points+$1 
WHERE user_id=$2`;
			
		const res = await client.query(sql, [add,user.user_id]);
		
		user.points += add;
		
		sql = `SELECT * FROM config WHERE id=1`;
			
		let config = await client.query(sql);
		config = config.rows[0];
		
		// NOTA(RECKER): Aumentar nivel
		let levels = calculate_level_up(user.points,config.xp_need);
		sql = `UPDATE experiences
		SET level=${levels}
		WHERE user_id=$1`;
		
		await client.query(sql,[user.user_id]);
		
		let response = await ctx.replyWithMarkdown('¡Experiencia agregada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('Se produjo un error al intentar agregar xp al usuario.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}
	
	await client.end();
}

const removexp = async (ctx) => {
	if (ctx.message.entities.length !== 2) {
		let response = await ctx.replyWithMarkdown('Debe de mencionar a un usuario\nEJ: /removexp @usuario cantidad');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
		return null;
	}
	
	const offset = ctx.message.entities[1].offset;
	const length = ctx.message.entities[1].length;
	
	let username = ctx.message.text.slice(offset, length + offset).slice(1);
	
	let remove = ctx.message.text.slice(ctx.message.entities[1].offset + ctx.message.entities[1].length + 1);
	
	if (!remove.length) {
		ctx.replyWithMarkdown('Debe de colocar una cantidad\nEJ: /removexp @usuario cantidad');
		ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		return null;
	}
	remove = parseInt(remove);
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	try {
		let sql = `SELECT experiences.* FROM experiences 
INNER JOIN users ON experiences.user_id = users.id
WHERE users.username=$1`;
			
		let user = await client.query(sql, [username]);
		user = user.rows[0];
		
		if (!user) {
			throw new Error('No existente');
		}
		
		sql = `UPDATE experiences SET points=CASE WHEN points > $1 THEN points - $1 ELSE 0 END
WHERE user_id=$2`;
			
		const res = await client.query(sql, [remove,user.user_id]);
		
		user.points -= remove;
		
		sql = `SELECT * FROM config WHERE id=1`;
			
		let config = await client.query(sql);
		config = config.rows[0];
		
		// NOTA(RECKER): Quitar nivel
		let levels = calculate_level_down(user.points, user.level, config.xp_need);
		sql = `UPDATE experiences
		SET level=${levels}
		WHERE user_id=$1`;

		await client.query(sql,[user.user_id]);
		
		let response = await ctx.replyWithMarkdown('¡Experiencia removida!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('Se produjo un error al intentar remover xp al usuario.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 2000);
	}
	
	await client.end();
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