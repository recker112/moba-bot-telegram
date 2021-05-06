// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const registrar = async (ctx) => {
	const client = new Client({
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false
		}
	});
	
	await client.connect();
	
	let sql = 'SELECT chat_id FROM configs WHERE id=1';

	let configs = await client.query(sql);
	configs = configs.rows[0];
	
	if (configs.chat_id != ctx.message.chat.id) {
		let response = await ctx.reply('Solo puede usar este comando en el grupo instalado');
		
		setTimeout(() => {
			ctx.deleteMessage(ctx.message.message_id);
			ctx.deleteMessage(response.message_id);
		}, 4000);
		return null;
	}

	sql = 'SELECT * FROM users where id=$1';

	let user = await client.query(sql,[ctx.from.id]);
	user = user.rows[0];

	// NOTA(RECKER): Evitar el registro
	if (user) {
		let response = await ctx.reply('Ya estás registrado');
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
		}, 5000);
		
		await client.end();
		return null;
	}
	
	sql = 'INSERT INTO users (id,username) VALUES ($1,$2)';
	await client.query(sql,[ctx.from.id, ctx.from.username]);

	sql = 'INSERT INTO experiences (user_id) VALUES ($1);'
	await client.query(sql,[ctx.from.id]);
	
	sql = 'INSERT INTO effects (user_id) VALUES ($1);';
	await client.query(sql, [ctx.from.id]);
	
	ctx.deleteMessage(ctx.message.id);
	
	ctx.reply(`@${ctx.from.username} se unió al campo de batalla`);
	await client.end();
}

module.exports = registrar;