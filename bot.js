// NOTA(RECKER): Iniciar variables
const dotenv = require('dotenv');
dotenv.config();

// NOTA(RECKER): DB
require('./db/DB');
const Database = require('sqlite-async');

require('./parseCeil');

const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// NOTA(RECKER): Configuraciones de puntos
const double = 4;

bot.telegram.getMe().then((botInfo) => {
	bot.options.username = botInfo.username
})

bot.start(ctx => {
	ctx.replyWithMarkdown('Bot moba *privado*');
});

bot.help(ctx => {
	ctx.replyWithMarkdown(`|------- *MOBA RANK parche 2021.5.1* -------|
Puedes usar los siguientes comandos para interactuar con el sistema:
/registrar - Crea una cuenta para unirte a la batalla
/status - Ve tus puntajes, daño y demás
/top - Ve quienes son el TOP 5 mejores brujas del anime
/pelea - Entra en una batalla contra otro usuario _(PRONTO)_

*¿CÓMO JUGAR?*
Simplemente escribe un mensaje y ya estarás jugando. La *Agresividad* sube cuando usas alguna de las palabras registradas como _AGRESIVAS_, lo mismo para con la *CARIÑOSIDAD*.

También si mencionas a otra persona @usuaro o simplemente respondes un comentario con alguna de estas dos palabras, los puntos se duplican y sus efectos serán aplicados.`);
});

bot.settings(ctx => {
	ctx.reply(`|------- *MOBA RANK CONFIG parche 2021.5.1* -------|
Puedes usar los siguientes comandos para configurar el sistema:
/addword_soft - Aregar una palabra cariñosa a la lista (EJ: /addword_soft word)
/addword - Aregar una palabra agresiva a la lista (EJ: /addword word)
/wordlist - Ver lista de todas las palabras disponibles
/removeword - Eliminar una palabra de la lista (EJ: /removeword word)`);
});

bot.command('registrar', async ctx => {
	const db = await Database.open("./moba.db");

	let sql = 'SELECT * FROM users where id=?';

	const user = await db.get(sql,[ctx.from.id]);

	// NOTA(RECKER): Evitar el registro
	if (user) {
		return null;
	}

	sql = 'INSERT INTO users (id,username) VALUES (?,?)';
	const res = await db.run(sql,[ctx.from.id, ctx.from.username]);

	sql = 'INSERT INTO experiences (user_id) VALUES (?);'
	const res2 = await db.run(sql,[ctx.from.id]);
	ctx.reply(`@${ctx.from.username} se unió al campo de batalla`);
});

bot.command('c_prendio', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	
	const db = await Database.open("./moba.db");
	let sql = "SELECT * FROM config WHERE id=1";
	
	const config = await db.get(sql);
	
	sql = "UPDATE config SET double_exp=? WHERE id=1";
	const res = await db.run(sql,[!config.double_exp]);
	
	if (!config.double_exp) {
		ctx.replyWithMarkdown(`*MODO AGRESIVIDAD ACTIVA.*\nAhora hay un x${double} en la EXP.`);
	}else {
		ctx.replyWithMarkdown('*Se acabó lo que se daba.*\nAhora hay un x1 en la EXP.');
	}
});

// NOTA(RECKER): Ver stats
bot.command('stats', async ctx => {
	// NOTA(RECKER): Solo por mensaje privado
	/*if (ctx.chat.type !== 'private') {
		return null;
	}*/

	const db = await Database.open("./moba.db");
	let sql = `SELECT * FROM experiences WHERE user_id=?`;

	const user = await db.get(sql,[ctx.from.id]);
	
	if (!user) {
		return null;
	}
	
	const nivel = Math.floor(user.points * 0.01) + 1;
	const aggressiveness = Math.round10(user.aggressiveness, -2);
	const pato = Math.round10(user.pateria, -2);
	
	const damage_base = 5 * nivel;
	const vida_base = 20 * nivel;

	let text = `_Ficha de ${ctx.from.first_name} ${ctx.from.last_name}:_
_Daño: ${damage_base + ((damage_base * aggressiveness) / 100)}_
_Vida: ${vida_base - ((vida_base * pato) / 100)}_
_EXP: ${user.points} pts_
_Nivel: ${nivel}_
_Insultos: ${user.insults}_

*ESTADOS*
_Agresividad: ${aggressiveness}%_
_Cariñosidad: ${pato}%_`;

	ctx.replyWithMarkdown(text);
});

// NOTA(RECKER): Top
bot.command('top', async ctx => {
	const db = await Database.open("./moba.db");
	let sql = `SELECT users.username, experiences.points, experiences.insults, experiences.aggressiveness, experiences.pateria
		FROM users
		INNER JOIN experiences ON users.id = experiences.user_id
		ORDER BY experiences.points DESC
		LIMIT 5`;

	const users = await db.all(sql);

	let text = '|-------------------- *TOP 5* --------------------|\n';
	users.map((user, i) => {
		const nivel = Math.floor(user.points * 0.01) + 1;
		const aggressiveness = Math.round10(user.aggressiveness, -2);
		const pato = Math.round10(user.pateria, -2);

		const damage_base = 5 * nivel;
		const vida_base = 20 * nivel;
		
		text += `*#${i+1} @${user.username}*\n`;
		text += `- Nivel: ${nivel}\n`;
		text += `- Exp: ${user.points} pts\n`;
		text += `- Vida: ${vida_base - ((vida_base * pato) / 100)}\n`;
		text += `- Daño: ${damage_base + ((damage_base * aggressiveness) / 100)}\n`;
		text += `- Insultos: ${user.insults}\n`;
		text += `_- Agresividad: ${aggressiveness}%_\n`;
		text += `_- Cariñosidad: ${pato}%_\n`;
		if (users[i + 1]) {
			text = text + '\n\n';
		}
	});

	ctx.replyWithMarkdown(text);
});

// NOTA(RECKER): Update
bot.command('cuenta', async ctx => {
	ctx.replyWithMarkdown('MENU PARA ACTUALIZAR CUENTA');
});

// NOTA(RECKER): Agregar palabras lite
bot.command('addword_soft', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	
	let entities = ctx.message.entities;

	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra');
		return null;
	}
	
	const db = await Database.open("./moba.db");
	
	try {
		let sql = 'INSERT INTO words (word,status) VALUES (?,2)';
			
		const res = await db.run(sql, [word]);
		
		ctx.replyWithMarkdown('¡Palabra agregada!');
	}catch (e) {
		console.log(e);
		ctx.replyWithMarkdown('La palabras introducidas ya se encuentra registrada, intente de nuevo.');
	}
});

// NOTA(RECKER): Agregar palabras
bot.command('addword', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra');
		return null;
	}
	
	const db = await Database.open("./moba.db");
	
	try {
		let sql = 'INSERT INTO words (word,status) VALUES (?,1)';
			
		const res = await db.run(sql, [word]);
		
		ctx.replyWithMarkdown('¡Palabra agregada!');
	}catch (e) {
		console.log(e);
		ctx.replyWithMarkdown('La palabras introducidas ya se encuentra registrada, intente de nuevo.');
	}
});

// NOTA(RECKER): Listar palabras
bot.command('wordlist', async ctx => {
	const db = await Database.open("./moba.db");
	let sql = 'SELECT * FROM words';

	const words = await db.all(sql);
	
	let wordsList = '';
	words.map(({ word, status }) => {
		wordsList = wordsList + `- *${word}* ${status === 1 ? '_(AGRESIVA)_' : '_(CARIÑOSA)_'}\n`;
	})
	
	ctx.replyWithMarkdown(`Estas son las palabras registradas:\n
${wordsList}`);
});

// NOTA(RECKER): Eliminar palabras
bot.command('removeword', async ctx => {
	if (ctx.from.id !== 1281463312) {
		return null;
	}
	
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra');
		return null;
	}
	
	const db = await Database.open("./moba.db");
	
	try {
		let sql = 'DELETE FROM words WHERE word=?';
			
		const res = await db.run(sql, [word]);
		
		ctx.replyWithMarkdown('¡Palabra eliminada!');
	}catch (e) {
		console.log(e);
		ctx.replyWithMarkdown('La palabras introducidas no se encuentra registrada, intente de nuevo.');
	}
});

// NOTA(RECKER): Funciones especiales
bot.command('pelea', async ctx => {
	console.log(ctx.message);
	ctx.replyWithMarkdown(`@${ctx.from.username} vs @`);
});

// NOTA(RECKER): CORE POINTS
bot.on('message', async ctx => {
	// NOTA(RECKER): No contar puntos si no es el grupo definido
	if (ctx.chat.id !== -1001200393360) {
		return null;
	}
	
	let base_points = 1;

	const db = await Database.open("./moba.db");
	let sql = 'SELECT * FROM config WHERE id=1';
	
	const config = await db.get(sql);
	
	// NOTA(RECKER): Registrar otras que no sean mensajes
	if (!ctx.message.text) {
		sql = `UPDATE experiences
			SET points=points+${(base_points + 1) * (config.double_exp ? double : 1)}, pateria=CASE WHEN pateria > 0.24 THEN pateria - 0.24 ELSE 0 END, aggressiveness=CASE WHEN aggressiveness > 0.24 THEN aggressiveness - 0.24 ELSE 0 END
			WHERE user_id=?`;
		
		const user = await db.run(sql,[ctx.from.id]);
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
		findReply = '@'+reply_to.from.username === ctx.from.username ? 0 : 1;
	}
	
	// NOTA(RECKER): LISTA DE PALABRAS MULTIPLICADORAS
	sql = 'SELECT * FROM words';
	const words = await db.all(sql) || [];
	
	let findWords = 0;
	let findWordsLevel
	words.forEach(({ word, status }) => {
		if (findWords === 0) {
			if (ctx.message.text.search(word) > -1) {
				findWords = status;
			}
		}
		
		if (findWords === 0) {
			if (ctx.message.text.search(word.toUpperCase()) > -1) {
				findWords = status;
			}
		}
		
		if (findWords === 0) {
			let find = word.charAt(0).toUpperCase() + word.slice(1);
			if (ctx.message.text.search(find) > -1) {
				findWords = status;
			}
		}
	});
	
	if (findWords === 1 && (findMention > 0 || findReply > 0)) {
		// NOTA(RECKER): Mensaje con agresividad
		sql = `UPDATE experiences
		SET points=points+${(base_points * 2) * (config.double_exp ? double : 1)}, insults=insults+1,
aggressiveness=aggressiveness+1
		WHERE user_id=?`;
	}else if (findWords === 2 && (findMention > 0 || findReply > 0)) {
		// NOTA(RECKER): Mensaje cariñoso (Mention o Reply)
		sql = `UPDATE experiences
		SET points=points+${(base_points * 2) * (config.double_exp ? double : 1)}, pateria=pateria+2
		WHERE user_id=?`;
	}else if (findWords === 2) {
		// NOTA(RECKER): Mensaje cariñoso
		sql = `UPDATE experiences
		SET points=points+${(base_points * 2) * (config.double_exp ? double : 1)}, pateria=pateria+1
		WHERE user_id=?`;
	}else if (findWords === 1) {
		// NOTA(RECKER): Mensaje con palabra
		sql = `UPDATE experiences
		SET points=points+${(base_points * 2) * (config.double_exp ? double : 1)}, insults=insults+1 
		WHERE user_id=?`;
	}else {
		// NOTA(RECKER): Mensaje normal
		sql = `UPDATE experiences
		SET points=points+${base_points * (config.double_exp ? double : 1)}, pateria=CASE WHEN pateria > 0.24 THEN pateria - 0.24 ELSE 0 END, aggressiveness=CASE WHEN aggressiveness > 0.24 THEN aggressiveness - 0.24 ELSE 0 END
		WHERE user_id=?`;
	}
	
	const user = await db.run(sql,[ctx.from.id]);
});

bot.launch();