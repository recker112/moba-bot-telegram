// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../../DB');

const { calculate_level } = require('./AddXP');

const removexp_awaitResponse =  async (ctx) => {
	let response = await ctx.reply(`Para remover xp a un usuario use el siguiente formato:

@usuario1 - 3.8
@usuario2 - 4000

Para cancelar simplemente escriba /cancel`);
	
	// NOTA(RECKER): Obtener infex
	let find = -1;
	let session = ctx.session.awaitResponse;
	if (session) {
		find = ctx.session.awaitResponse.findIndex(({type}) => type === 'removexp');
	}else {
		ctx.session.awaitResponse = [];
	}
	
	// NOTA(RECKER): Guardar en session
	if (find > -1) {
		const awaitResponse = ctx.session.awaitResponse[find];
		ctx.session.awaitResponse[find] = {
			type: 'removexp',
			message_remove: [
				...awaitResponse.message_remove,
				response.message_id,
			],
		}
		ctx.session.awaitID = find;
	}else {
		let length = typeof ctx.session.awaitResponse !== 'object' ? 0 : ctx.session.awaitResponse.length;
		
		ctx.session.awaitResponse[length] = {
			type: 'removexp',
			message_remove: [
				response.message_id,
			],
		}
		ctx.session.awaitID = length;
	}
}

const removexp = async (ctx) => {
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
	let updates = 0;
	let remove_messages = [];
	
	// NOTA(RECKER): Verificar cancel
	let cancel_user = false;
	if (ctx.message.text.search('/cancel') > -1) {
		cancel_user = true;
	}
	
	// NOTA(RECEKR): Recorrer texto
	let i=0;
	while (text[i]) {
		if (cancel_user) {
			break;
		}
		
		const line = text[i];
		
		let params = line.split('-');
		let cancel = false;
		if (params.length !== 2) {
			cancel = true;
		}
		
		if (!cancel) {
			params[0] = params[0].trim();
			params[1] = parseFloat(params[1].trim());
		}
		
		if (!cancel && !params[1]) {
			cancel = true;
		}
		
		let user;
		if (!cancel) {
			sql = 'SELECT users.id, experiences.points FROM users INNER JOIN experiences ON experiences.user_id = users.id WHERE username=$1';
		
			user = await client.query(sql,[params[0].slice(1)]);
			user = user.rows[0];
		}
		
		if (!cancel && user) {
			sql = 'UPDATE experiences SET points=CASE WHEN points > $1 THEN points - $1 ELSE 0 END WHERE user_id=$2';

			await client.query(sql, [params[1],user.id]);

			user.points -= params[1];

			// NOTA(RECKER): Quitar nivel
			let levels = calculate_level(user.points, config.xp_need);
			sql = 'UPDATE experiences SET level=$1 WHERE user_id=$2';
			
			await client.query(sql,[levels,user.id]);
			
			updates++;
			querys++;
		} else {
			if (!cancel) {
				querys++;
			}
		}
		i++;
	}
	
	// NOTA(RECKER): Mensajes de respuestas
	let text_id = ctx.message.message_id;
	let response;
	if (!querys && !cancel_user) {
		response = await ctx.reply(`Para remover xp a un usuario use el siguiente formato:

@usuario1 - 3.8
@usuario2 - 4000

Si desea cancelar puede usar el comando /cancel.`);
	}else if (querys && !updates && !cancel_user) {
		response = await ctx.reply(`Ninguna de las lineas ingresadas se pudo procesar, es posible que esto se deba a los siguientes puntos:

1) El formato no es correcto.
2) El segundo parámetros no es un número o es mejor a 0.
3) Los usuarios no se encuentran registrados.

Si desea cancelar puede usar el comando /cancel.`);
	}else if (querys > updates && !cancel_user) {
		response = await ctx.reply(`Algunas lineas fueron procesadas correctamente, los errores en las demás lineas se debe a:

1) El formato no es correcto.
2) El segundo parámetros no es un número o es mejor a 0.
3) El usuario no se encuentra registrado.

Si desea cancelar puede usar el comando /cancel.`);
	} else if (querys && updates && querys === updates && !cancel_user) {
		response = await ctx.replyWithMarkdown('Experiencias removidas!');
	} else {
		response = await ctx.replyWithMarkdown('Acción cancelada!');
	}
	
	// NOTA(RECKER): Agregar mensaje del usuario
	remove_messages.push(text_id);
	
	let session = ctx.session.awaitResponse[ctx.session.awaitID];
	if ((querys && updates && querys === updates) || cancel_user) {
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
			type: 'removexp',
			message_remove: [
				...session.message_remove,
				...remove_messages,
			],
		}
	}
	
	await client.end();
}

module.exports = {
	removexp,
	removexp_awaitResponse,
};