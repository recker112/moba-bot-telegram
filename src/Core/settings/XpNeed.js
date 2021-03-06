// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../../DB');

const xp_need_awaitResponse =  async (ctx) => {
	// NOTA(RECKER): Obtener configuracion
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = 'SELECT xp_need FROM configs WHERE id=1';
	
	let configs = await client.query(sql);
	configs = configs.rows[0];
	
	client.end();
	
	let response = await ctx.replyWithMarkdown(`La *XP* necesaria para el siguiente nivel actualmente se encuentra en *${configs.xp_need}*, para cambiarlo simplemente escriba la nueva cantidad.

Si desea cancelar esta acción puede usar /cancel.`);
	
	// NOTA(RECKER): Obtener infex
	let find = -1;
	let session = ctx.session.awaitResponse;
	if (session) {
		find = ctx.session.awaitResponse.findIndex(({type}) => type === 'xp_need');
	}else {
		ctx.session.awaitResponse = [];
	}
	
	// NOTA(RECKER): Guardar en session
	if (find > -1) {
		const awaitResponse = ctx.session.awaitResponse[find];
		ctx.session.awaitResponse[find] = {
			type: 'xp_need',
			message_remove: [
				...awaitResponse.message_remove,
				response.message_id,
			],
		}
		ctx.session.awaitID = find;
	}else {
		let length = typeof ctx.session.awaitResponse !== 'object' ? 0 : ctx.session.awaitResponse.length;
		
		ctx.session.awaitResponse[length] = {
			type: 'xp_need',
			message_remove: [
				response.message_id,
			],
		}
		ctx.session.awaitID = length;
	}
}

const xp_need = async (ctx) => {
	// NOTA(RECKER): Obtener configs
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = `SELECT * FROM configs WHERE id=1`;
			
	let config = await client.query(sql);
	config = config.rows[0];
	
	// NOTA(RECKER): Variables
	let number = ctx.message.text;
	number = number.split('\n');
	number = Math.round10(parseFloat(number[0]), -2);
	let updated = false;
	let remove_messages = [];
	
	// NOTA(RECKER): Verificar cancel
	let cancel_user = false;
	if (ctx.message.text.search('/cancel') > -1) {
		cancel_user = true;
	}
	
	// NOTA(RECEKR): Cambiar xp_need
	if (number && number > 0) {
		sql = 'UPDATE configs SET xp_need=$1 WHERE id=1';

		await client.query(sql, [number]);

		updated++;
	}
	
	// NOTA(RECKER): Mensajes de respuestas
	let text_id = ctx.message.message_id;
	let response;
	if (!updated && !cancel_user) {
		response = await ctx.reply(`No se ha podido actualizar la xp necesarioa para el siguiente nivel, estas pueden ser sus causas:

1) El texto introducido no es un número.
2) La cantidad introducida es menor a 0

Si desea cancelar puede usar el comando /cancel,`);
	}else if (updated && !cancel_user) {
		response = await ctx.replyWithMarkdown('Cambio realizado!');
	} else {
		response = await ctx.replyWithMarkdown('Acción cancelada!');
	}
	
	// NOTA(RECKER): Agregar mensaje del usuario
	remove_messages.push(text_id);
	
	let session = ctx.session.awaitResponse[ctx.session.awaitID];
	if (updated || cancel_user) {
		// NOTA(RECKER): Eliminar session finalizada
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 4000);
		
		// NOTA(RECKER): Eliminar mensajes anteriores
		ctx.deleteMessage(ctx.message.message_id);
		session.message_remove && session.message_remove.map((id) => {
			ctx.deleteMessage(id);
		});
		
		// NOTA(RECKER): Eliminar session
		ctx.session.awaitResponse.splice(ctx.session.awaitID,1);
		ctx.session.awaitID = null;
	}else {
		// NOTA(RECKER): Guardar en session en espera de mas respuestas
		remove_messages.push(response.message_id);
		
		ctx.session.awaitResponse[ctx.session.awaitID] = {
			type: 'xp_need',
			message_remove: [
				...session.message_remove,
				...remove_messages,
			],
		}
	}
	
	client.end();
}

module.exports = {
	xp_need_awaitResponse,
	xp_need,
}