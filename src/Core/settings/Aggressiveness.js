// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../../DB');

const aggressiveness_awaitResponse =  async (ctx) => {
	// NOTA(RECKER): Obtener configuracion
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = 'SELECT aggressiveness_discount, aggressiveness_aggregate FROM configs WHERE id=1';
	
	let configs = await client.query(sql);
	configs = configs.rows[0];
	
	client.end();
	
	let response = await ctx.replyWithMarkdown(`Estas son las cantidades de la *AGRESIVIDAD*:

- Agresividad a descontar por cada mensaje normal: *${configs.aggressiveness_discount}%*.
- Agresividad a aumentar por decir una palabra agresiva: *${configs.aggressiveness_aggregate}%*.
- Agresividad a aumentar por responder o @mencionar con una palabra agresiva: *${configs.aggressiveness_aggregate}% x 1.5*.

El formato que debe usar para modificar alguna de estas opciones es el siguiente:

descontar - cantidad
o
aumentar - cantidad

Si desea cancelar esta acción puede usar /cancel.`);
	
	// NOTA(RECKER): Obtener infex
	let find = -1;
	let session = ctx.session.awaitResponse;
	if (session) {
		find = ctx.session.awaitResponse.findIndex(({type}) => type === 'aggressiveness');
	}else {
		ctx.session.awaitResponse = [];
	}
	
	// NOTA(RECKER): Guardar en session
	if (find > -1) {
		const awaitResponse = ctx.session.awaitResponse[find];
		ctx.session.awaitResponse[find] = {
			type: 'aggressiveness',
			message_remove: [
				...awaitResponse.message_remove,
				response.message_id,
			],
		}
		ctx.session.awaitID = find;
	}else {
		let length = typeof ctx.session.awaitResponse !== 'object' ? 0 : ctx.session.awaitResponse.length;
		
		ctx.session.awaitResponse[length] = {
			type: 'aggressiveness',
			message_remove: [
				response.message_id,
			],
		}
		ctx.session.awaitID = length;
	}
}

const aggressiveness = async (ctx) => {
	// NOTA(RECKER): Obtener configs
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = `SELECT * FROM configs WHERE id=1`;
			
	let config = await client.query(sql);
	config = config.rows[0];
	
	// NOTA(RECKER): Variables
	let text = ctx.message.text;
	text = text.split('\n');
	text = text[0];
	let updated = false;
	let remove_messages = [];
	let params = text.split('-');
	let cancel = false;
	
	// NOTA(RECKER): Verificar cancel
	let cancel_user = false;
	if (ctx.message.text.search('/cancel') > -1) {
		cancel_user = true;
	}
	
	// NOTA(RECKER): Verificar params
	if (!cancel_user && params.length === 2) {
		params[0] = params[0].trim();
		params[1] = Math.round10(parseFloat(params[1].trim()), -2);
		
		if (params[0] === 'descontar') {
			params[0] = 'aggressiveness_discount';
		}else if (params[0] === 'aumentar') {
			params[0] = 'aggressiveness_aggregate';
		}else {
			cancel = true;
		}
		
		if (!params[1]) {
			cancel = true;
		}
	}else {
		cancel = true;
	}
	
	// NOTA(RECEKR): Cambiar aggressiveness
	if (!cancel && params[1] > 0) {
		sql = `UPDATE configs SET ${params[0]} = $1 WHERE id=1`;

		await client.query(sql, [params[1]]);

		updated++;
	}
	
	// NOTA(RECKER): Mensajes de respuestas
	let text_id = ctx.message.message_id;
	let response;
	if (!updated && !cancel_user) {
		response = await ctx.reply(`No se ha podido actualizar la agresividad, estas pueden ser sus causas:

1) El formato no es el correcto.
2) El segundo parámetro no es un número.
2) La cantidad introducida es menor a 0.

Si desea cancelar puede usar el comando /cancel.`);
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
			type: 'aggressiveness',
			message_remove: [
				...session.message_remove,
				...remove_messages,
			],
		}
	}
	
	client.end();
}

module.exports = {
	aggressiveness_awaitResponse,
	aggressiveness,
}