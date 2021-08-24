// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../../DB');

const removegolpe_awaitResponse =  async (ctx) => {
	let response = await ctx.reply(`Para eliminar un golpe del sistema use el siguiente formato:

palabra1
palabra2

Para cancelar simplemente escriba /cancel.`);
	
	// NOTA(RECKER): Obtener infex
	let find = -1;
	let session = ctx.session.awaitResponse;
	if (session) {
		find = ctx.session.awaitResponse.findIndex(({type}) => type === 'removegolpe');
	}else {
		ctx.session.awaitResponse = [];
	}
	
	// NOTA(RECKER): Guardar en session
	if (find > -1) {
		const awaitResponse = ctx.session.awaitResponse[find];
		ctx.session.awaitResponse[find] = {
			type: 'removegolpe',
			message_remove: [
				...awaitResponse.message_remove,
				response.message_id,
			],
		}
		ctx.session.awaitID = find;
	}else {
		let length = typeof ctx.session.awaitResponse !== 'object' ? 0 : ctx.session.awaitResponse.length;
		
		ctx.session.awaitResponse[length] = {
			type: 'removegolpe',
			message_remove: [
				response.message_id,
			],
		}
		ctx.session.awaitID = length;
	}
	
}

const removegolpe = async (ctx) => {
	// NOTA(RECKER): Obtener configs
	const client = new Client(options_db);
	
	await client.connect();
	
	let sql = `SELECT * FROM configs WHERE id=1`;
			
	let config = await client.query(sql);
	config = config.rows[0];
	
	// NOTA(RECKER): Variables
	let text = ctx.message.text;
	text = text.split('\n');
	let querys = 0;
	let deletes = 0;
	let remove_messages = [];
	
	// NOTA(RECKER): Verificar cancel
	let cancel_user = false;
	if (ctx.message.text.search('/cancel') > -1) {
		cancel_user = true;
	}
	
	// NOTA(RECEKR): Recorrer texto
	let i=0;
	while (text[i]) {
		let line = text[i];
		line = line.trim();
		
		// NOTA(RECKER): Agregar palabra
		try {
			let sql = 'DELETE FROM fight_golpes WHERE golpe=$1';
			
			const res = await client.query(sql, [line]);

			if (!res.rowCount) {
				throw new Error('No register');
			}

			deletes++;
		}catch (e) {
			// Nothing
		}
		querys++;
		i++;
	}
	
	// NOTA(RECKER): Mensajes de respuestas
	let text_id = ctx.message.message_id;
	let response;
	if (!querys && !cancel_user) {
		response = await ctx.reply(`Para eliminar un golpe del sistema use el siguiente formato:

palabra1
palabra2

Para cancelar simplemente escriba /cancel.`);
	}else if (querys && !deletes && !cancel_user) {
		response = await ctx.reply(`Ninguna de las lineas ingresadas se pudo procesar, es posible que esto se deba a los siguientes puntos:

1) El formato no es correcto.
2) No se encuentra en la base de datos.
3) Problemas con el servidor.

Si desea cancelar puede usar el comando /cancel.`);
	}else if (querys > deletes && !cancel_user) {
		response = await ctx.reply(`Algunas lineas fueron procesadas correctamente, los errores en las demรกs lineas se debe a:

1) El formato no es correcto.
2) No se encuentra en la base de datos.
3) Problemas con el servidor.

Si desea cancelar puede usar el comando /cancel.`);
	} else if (querys && deletes && querys === deletes && !cancel_user) {
		response = await ctx.replyWithMarkdown('Palabras eliminadas!');
	} else {
		response = await ctx.replyWithMarkdown('Acciรณn cancelada!');
	}
	
	// NOTA(RECKER): Agregar mensaje del usuario
	remove_messages.push(text_id);
	
	let session = ctx.session.awaitResponse[ctx.session.awaitID];
	if ((querys && deletes && querys === deletes) || cancel_user) {
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
			type: 'removegolpe',
			message_remove: [
				...session.message_remove,
				...remove_messages,
			],
		}
	}
	
	await client.end();
}

module.exports = {
	removegolpe_awaitResponse,
	removegolpe,
}