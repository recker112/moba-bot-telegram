const { Markup } = require('telegraf');

const buttons = Markup.inlineKeyboard([
	[Markup.button.callback('Cerrar', 'close')]
]);

const help = async (ctx) => {
	let response = await ctx.replyWithMarkdown(`|-------------- *MOBA RANK ${process.env.VERSION}* --------------|
*¿CÓMO JUGAR?*
Para iniciar necesitas usar el comando /registrar, una vez utilizado ya podrás comenzar a jugar, la forma en que ganarás exp será en base a los mensajes que escribas y mandes a este y únicamente este chat. Ganarás el doble de exp al decir palabras agresivas y/o cariñosas (usar el comando /wordlist para ver las palabras que conforman ambas categorías) enviar audios, stickers, y otros también te permite ganar exp.

*FICHA DE JUGADOR*
La ficha de jugador te permitirá ver tus datos conforme avances, utilizando el comando /stats podrás acceder a ella, ver los debuff y acceder al historial de debuff, el cual te enseñará quienes fueron los usuarios que te metieron debuff.

*¿QUÉ ES UN DEBUFF?*
El debuff es una desventaja que te pueden dar otros jugadores o tu a ellos para desfavorecer tu desempeño, no obstante usarlo tiene su costo.

*CUENTA*
Usando el comando /cuenta puedes acceder a la compra de debuff para tus adversarios, y/o sincronizar cuenta si llegas a cambiar de @nickname.

*PELEA*
Las peleas son una forma efectiva pero muy peligrosa de ganar exp, cuando enfrentas a otro jugador usando el comando /pelea y ganas se te darán 10 de exp por victoria, y aumentará un porsentaje tu cariñosidad, si pierdes un combate solamente ganar agresividad.

*AGRESIVIDAD/CARIÑOSIDAD*
Ambas son buff automáticos del juego, sirven para moderar y/o alterar la ventaja de los jugadores

- Agresividad: cuando esta aumenta, te brinda un porcentaje de daño base adicional.

- Cariñosidad: cuando esta aumenta, te baja la vida base.

_Ambos buff se pueden quitar conforme escribas mensajes normales._

TOP
El comando /top sirve para ver el ranking de jugadores de más alto nivel.

Otros comandos:
/golpelist - Ve la lista de todos los golpes disponibles
/topseason - Ve los ganadores de cada season
/codigo - Ver el código del bot`, {
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