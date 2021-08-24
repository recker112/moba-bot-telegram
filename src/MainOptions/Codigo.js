const { Markup } = require('telegraf');

const buttons = Markup.inlineKeyboard([
	[Markup.button.callback('Cerrar', 'close')]
]);

const codigo = async (ctx) => {
	let response = await ctx.replyWithMarkdown(`|-------------- *MOBA RANK ${process.env.VERSION}* --------------|
Puedes ver el código [aquí](https://github.com/recker112/moba-bot-telegram)`, {
		reply_markup: buttons.reply_markup,
	});
	
	
	// NOTA(RECKER): Guardar en session
	let copy = typeof ctx.session.querys !== 'object' ? [] : ctx.session.querys;
	ctx.session.querys = [
		...copy,
		{
			id: response.message_id,
			chat_id: ctx.message.chat.id,
			message_remove: [
				ctx.message_id || ctx.message.message_id
			]
		}
	];
}

module.exports = codigo;