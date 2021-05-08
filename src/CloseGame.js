const PostgresSession = require('../telegraf-postgres');

const connectParams = {
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false
	}
}

const close = async (ctx) => {
	// NOTA(RECKER): Verificar que los querys sean un objeto
	if (typeof ctx.session.querys !== 'object') {
		ctx.answerCbQuery('Permiso denegado');
		return null;
	}
	
	// NOTA(RECKER): Buscar query
	let found_id = ctx.session.querys.findIndex((query) => query.id === ctx.update.callback_query.message.message_id)
	
	
	if (found_id <= -1) {
		ctx.answerCbQuery('Permiso denegado');
		return null;
	}
	let query = ctx.session.querys[found_id];
	
	// NOTA(RECKER): Eliminar mensaje de callback
	ctx.deleteMessage(query.id);
	
	// NOTA(RECKER): Eliminar mensajes
	query.message_remove && query.message_remove.map((id) => {
		ctx.deleteMessage(id);
	});
	
	// NOTA(RECKER): Eliminar query de la lista
	let copy = ctx.session.querys;
	copy.splice(found_id,1);
	
	ctx.session.querys = copy;
	
	// NOTA(RECKER): Eliminar game session
	const key = `game:${ctx.chat.id}:${ctx.update.callback_query.message.message_id}`;
	const sessions = new PostgresSession({
		connectionString: process.env.DATABASE_URL,
			ssl: {
				rejectUnauthorized: false
			}
	});
	
	sessions.saveSessionPostgress(key, null);
}

module.exports = close;