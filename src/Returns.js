const returns = async (ctx) => {
	// NOTA(RECKER): Verificar objeto
	if (typeof ctx.session.returns !== 'object') {
		await ctx.answerCbQuery('Permiso denegado');
		return null;
	}
	
	// NOTA(RECKER): Buscar query
	let found_id = ctx.session.returns.findIndex((returns) => returns.id === ctx.update.callback_query.message.message_id)
	
	
	if (found_id <= -1) {
		await ctx.answerCbQuery('Permiso denegado');
		return null;
	}
	let returns = ctx.session.returns[found_id];
	
	const init_state = returns.init_state;

	ctx.editMessageText(init_state.text, {
		reply_markup: init_state.buttons.reply_markup
	});
	
	// NOTA(RECKER): Eliminar returns de la lista
	let copy = ctx.session.returns;
	copy.splice(found_id,1);
	
	ctx.session.returns = copy;
}

module.exports = returns;