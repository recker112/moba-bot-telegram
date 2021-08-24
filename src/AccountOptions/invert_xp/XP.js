// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');
const { options_db } = require('../../DB');

const { calculate_level } = require('../../Core/settings/AddXP');

const xp_debuff_awaitResponse =  async (ctx) => {
	let response = await ctx.replyWithMarkdown(`Para agregar el debuffo de *XP* use siguiente formato:

@usuario - cantidad

Para cancelar simplemente escriba /cancel.`);
	
	// NOTA(RECKER): Obtener infex
	let find = -1;
	let session = ctx.session.awaitResponse;
	if (session) {
		find = ctx.session.awaitResponse.findIndex(({type}) => type === 'xp_debuff');
	}else {
		ctx.session.awaitResponse = [];
	}
	
	// NOTA(RECKER): Guardar en session
	if (find > -1) {
		const awaitResponse = ctx.session.awaitResponse[find];
		ctx.session.awaitResponse[find] = {
			type: 'xp_debuff',
			message_remove: [
				...awaitResponse.message_remove,
				response.message_id,
			],
		}
		ctx.session.awaitID = find;
	}else {
		let length = typeof ctx.session.awaitResponse !== 'object' ? 0 : ctx.session.awaitResponse.length;
		
		ctx.session.awaitResponse[length] = {
			type: 'xp_debuff',
			message_remove: [
				response.message_id,
			],
		}
		ctx.session.awaitID = length;
	}
}

const xp_debuff = async (ctx) => {
	// NOTA(RECKER): Obtener configs
	const client = new Client(options_db);
	
	await client.connect();
	
	// NOTA(RECKER): Variables
	let text = ctx.message.text;
	text = text.split('\n');
	text = text[0];
	let cancel = false;
	let insert = false;
	let remove_messages = [];
	
	// NOTA(RECKER): Verificar cancel
	let cancel_user = false;
	if (ctx.message.text.search('/cancel') > -1) {
		cancel_user = true;
	}
	
	// NOTA(RECKER: Params
	let params = text.split('-');
	if (params.length === 2) {
		params[0] = params[0].slice(1).trim();
		params[1] = parseInt(params[1].trim());
		
		if (!params[1] && params[1] <= 0) {
			cancel = true;
		}
	}else {
		cancel = true;
	}
	
	// NOTA(RECKER): Obtener usuario
	let user;
	let sql;
	let consume_xp = 37;
	if (!cancel) {
		sql = `SELECT * FROM users WHERE username=$1`;
			
		user = await client.query(sql,[params[0]]);
		user = user.rows[0];
	}
	
	// NOTA(RECEKR): Agregar debuff
	let not_points = false;
	if (!cancel && user) {
		// NOTA(RECKER): Obtener usuario
		sql = 'SELECT points FROM experiences WHERE user_id=$1';
		
		let user_from = await client.query(sql, [ctx.from.id]);
		user_from = user_from.rows[0];
		
		user_from.points -= params[1] * consume_xp;
		user_from.points = Math.round10(user_from.points, -2);

		if (user_from.points >= 0) {
			sql = `SELECT xp_need FROM configs WHERE id=1`;
			
			let config = await client.query(sql);
			config = config.rows[0];
			
			// NOTA(RECKER): Agregar debufo
			sql = `INSERT INTO debuffs(user_id, user_from, type, amount, xp_amount, expired_at) VALUES ($1, $2, 'xp_debuff', $3, $4, now()::timestamp + '30 days'::INTERVAL)`;

			await client.query(sql, [user.id, ctx.from.id, params[1], consume_xp*params[1]]);
			
			// NOTA(RECKER): Descontar XP
			const levels = calculate_level(user_from.points, config.xp_need);
			
			sql = 'UPDATE experiences SET points=$1, level=$2 WHERE user_id=$3';
			
			await client.query(sql, [user_from.points, levels, ctx.from.id]);

			insert++;
		}else {
			not_points = params[1] * consume_xp;
		}
	}
	
	// NOTA(RECKER): Mensajes de respuestas
	let text_id = ctx.message.message_id;
	let response;
	if (!user && !insert && !cancel_user && !cancel) {
		response = await ctx.replyWithMarkdown(`No se ha podido agregar el debufo de *XP* porque el *usuario* seleccionado *no se encuentra registrado*, por favor intente con uno registrado.

Si desea cancelar puede usar el comando /cancel.`);
	}else if (not_points && !insert && !cancel_user) {
		response = await ctx.replyWithMarkdown(`No se ha podido agregar el debufo de *XP* porque *no dispone de ${not_points}XP* para realizar esta acción, por favor *intente con una cantidad menor*.

Si desea cancelar puede usar el comando /cancel.`);
	}else if (!insert && !cancel_user) {
		response = await ctx.reply(`No se ha podido agregar el debufo de XP, estas pueden ser sus causas:

1) Error en el formato.
2) El segundo parámetro no es un número.
3) La cantidad introducida es menor a 0

Si desea cancelar puede usar el comando /cancel.`);
	}else if (insert && !cancel_user) {
		response = await ctx.replyWithMarkdown(`@${ctx.from.username} pagó ${params[1] * consume_xp}XP para darle un debufo a @${params[0]}`);
	} else {
		response = await ctx.replyWithMarkdown('Acción cancelada!');
	}
	
	// NOTA(RECKER): Agregar mensaje del usuario
	remove_messages.push(text_id);
	
	let session = ctx.session.awaitResponse[ctx.session.awaitID];
	if (insert || cancel_user) {
		if (!insert) {
			// NOTA(RECKER): Eliminar mensaje
			setTimeout(() => {
				ctx.deleteMessage(response.message_id);
			}, 4000);
		}
		
		// NOTA(RECKER): Eliminar mensajes anteriores
		ctx.deleteMessage(ctx.message.message_id);
		session.message_remove && session.message_remove.map((id) => {
			ctx.deleteMessage(id);
		});
		
		// NOTA(RECKER): Eliminar session finalizada
		ctx.session.awaitResponse.splice(ctx.session.awaitID,1);
		ctx.session.awaitID = null;
	}else {
		// NOTA(RECKER): Guardar en session en espera de mas respuestas
		remove_messages.push(response.message_id);
		
		ctx.session.awaitResponse[ctx.session.awaitID] = {
			type: 'xp_debuff',
			message_remove: [
				...session.message_remove,
				...remove_messages,
			],
		}
	}
	
	client.end();
}

module.exports = {
	xp_debuff_awaitResponse,
	xp_debuff,
}