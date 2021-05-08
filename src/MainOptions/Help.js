const { Markup } = require('telegraf');

// NOTA(RECKER): Conectarse a la DB
const { Client } = require('pg');

const buttons = Markup.inlineKeyboard([
	[Markup.button.callback('Cerrar', 'close')]
]);

const help = async (ctx) => {
	let response = await ctx.replyWithMarkdown(`|-------------- *MOBA RANK ${process.env.VERSION}* --------------|
Estos son los comandos disponibles actualmente
/registrar - Crea una cuenta para poder jugar
/cuenta - Ve diferentes acciones que puedes realizar con tu cuenta
/wordlist - Ve la lista de todas las palabras disponibles
/stats - Ve tus estadísticas, debufos y más
/top - Ve el TOP 5 jugadores de esta season
/topseason - Ve los ganadores de cada season
/duelo - Es hora de un dududududdudududud DUELO

*¿CÓMO JUGAR?*
Simplemente escribe un mensaje y ya estarás jugando. La *Agresividad* sube cuando usas alguna de las palabras registradas como *AGRESIVAS*, lo mismo para con la *Cariñosidad*. Al utilizar estas palabras recibiras un x2 de puntos.

También si mencionas a otra persona @usuaro o simplemente respondes un comentario con alguna de estas dos tipos de palabras, su efecto será mayor.

Si tienes curiosidad puedes ver el código [aquí](https://github.com/recker112/moba-bot-telegram)`, {
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

module.exports = help;