// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../DB');

const c_prendio = async (ctx, double) => {
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = "SELECT * FROM configs WHERE id=1";
	
	let config = await client.query(sql);
	config = config.rows[0];
	
	if (config.owner_id != ctx.from.id) {
		let response = await ctx.reply('Permiso denegado');
		
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
			ctx.deleteMessage(ctx.message.message_id);
		}, 4000);
		return null;
	}
	
	let number = ctx.message.text.split(' ');
	number = parseInt(number[1]);
	
	if (!number) {
		ctx.reply('Debe agregar una cantidad para multiplicar\nEJ: /fire 4')
		return null;
	}
	
	number = number > 0 ? number : 1;
	
	sql = "UPDATE configs SET double_exp=$1 WHERE id=1";
	const res = await client.query(sql,[number]);
	
	if (number > 1) {
		ctx.replyWithMarkdown(`*MODO C PRENDIÓ ACTIVO.*\nAhora hay un x${number} en la EXP.`);
	}else {
		ctx.replyWithMarkdown('*Se acabó lo que se daba.*\nAhora hay un x1 en la EXP.');
	}
	
	ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
	await client.end();
}

module.exports = c_prendio;