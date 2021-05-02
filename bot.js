// NOTA(RECKER): Iniciar variables
const dotenv = require('dotenv');
dotenv.config();

// NOTA(RECKER): DB
require('./db/DB');
const Database = require('sqlite-async');

const { Telegraf } = require('telegraf');

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
	const bot = new Telegraf(process.env.BOT_TOKEN);

	bot.telegram.getMe().then((botInfo) => {
		bot.options.username = botInfo.username
	})

	bot.start(ctx => {
		ctx.replyWithMarkdown('Bot moba *privado*');
	});

	bot.help(ctx => {
		ctx.reply('Ayuda');
	});

	bot.settings(ctx => {
		ctx.reply('Configuración');
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

	// NOTA(RECKER): Ver stats
	bot.command('stats', async ctx => {
		// NOTA(RECKER): Solo por mensaje privado
		if (ctx.chat.type !== 'private') {
			return null;
		}

		const db = await Database.open("./moba.db");
		let sql = `SELECT points FROM experiences WHERE user_id=?`;

		const user = await db.get(sql,[ctx.from.id]);

		let text = `Hola ${ctx.from.first_name} ${ctx.from.last_name}, estas son tus estadísticas:
	*EXP*: ${user.points || 0} pts
	*Nivel*: ${Math.floor(user.points * 0.01) || 0}`;

		ctx.replyWithMarkdown(text);
	});

	// NOTA(RECKER): Top
	bot.command('top', async ctx => {
		const db = await Database.open("./moba.db");
		let sql = `SELECT users.username, experiences.points, experiences.insults
			FROM users
			INNER JOIN experiences ON users.id = experiences.user_id
			ORDER BY experiences.points DESC
			LIMIT 5`;

		const users = await db.all(sql);

		let text = '|--------------------*TOP 5*--------------------|\n';
		users.map((user, i) => {
			text = text + `*#${1} @${user.username}*\n- Nivel: ${Math.floor(user.points * 0.01)}\n- Exp: ${user.points}\n- Insultos: ${user.insults}`;
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

	// NOTA(RECKER): Funciones especiales
	bot.hears(['sapo','Sapo','SAPO'], async ctx => {
		if (ctx.chat.id !== -1001200393360) {
			return null;
		}

		const db = await Database.open("./moba.db");
		let sql = `UPDATE experiences
			SET points=points+2, insults=insults+1
			WHERE user_id=?`;

		const user = await db.run(sql,[ctx.from.id]);
	});

	bot.hears(['bruja','Bruja','BRUJA'], async ctx => {
		if (ctx.chat.id !== -1001200393360) {
			return null;
		}

		const db = await Database.open("./moba.db");
		let sql = `UPDATE experiences
			SET points=points+2, insults=insults+1
			WHERE user_id=?`;

		const user = await db.run(sql,[ctx.from.id]);
	});

	// NOTA(RECKER): Mensajes normales
	bot.on('message', async ctx => {
		// NOTA(RECKER): No supar puntos si no es el grupo definido
		if (ctx.chat.id !== -1001200393360) {
			return null;
		}

		const db = await Database.open("./moba.db");
		let sql = `UPDATE experiences
			SET points=points+1
			WHERE user_id=?`;

		const user = await db.run(sql,[ctx.from.id]);
	});

	bot.launch();
  res.send('Hello World!');
})

app.listen(port, () => {
  console.log(`Escuchando en el host http://localhost:${port}`);
})