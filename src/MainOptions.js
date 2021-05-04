const start = async (ctx) => {
	ctx.replyWithMarkdown('Bot moba *privado*');
}

const help = async (ctx) => {
	let response = await ctx.replyWithMarkdown(`|-------------- *MOBA RANK ${process.env.VERSION}* --------------|
Puedes usar los siguientes comandos para interactuar con el sistema:
/registrar - Crea una cuenta para unirte a la batalla
/status - Ve tus puntajes, daño y demás
/top - Ve quienes son el TOP 5 mejores brujas del anime
/pelea - Entra en una batalla contra otro usuario
/wordlist - Ver lista de todas las palabras disponibles
/golpelist - Ver lista de todos los goles disponibles

*¿CÓMO JUGAR?*
Simplemente escribe un mensaje y ya estarás jugando. La *Agresividad* sube cuando usas alguna de las palabras registradas como _AGRESIVAS_, lo mismo para con la *CARIÑOSIDAD*. Al utilizar estas palabras recibiras un x2 de puntos.

También si mencionas a otra persona @usuaro o simplemente respondes un comentario con alguna de estas dos tipos de palabras, sus efectos serán aplicados.

Si tienes curiosidad puedes ver el código [aquí](https://github.com/recker112/moba-bot-telegram)`);
	
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
		ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
	}, 30000);
}

const settings = async (ctx) => {
	let response = await ctx.replyWithMarkdown(`|-------------- *MOBA RANK CONFIG ${process.env.VERSION}* --------------|
Puedes usar los siguientes comandos para configurar el sistema:
/addword_soft - Aregar una palabra cariñosa a la lista
/addword - Aregar una palabra agresiva a la lista
/removeword - Eliminar una palabra de la lista
/addgolpe - Agrega un golpe a la lista
/removegolpe - Elimina un golpe de la lista
/addxp - Agregar xp a un usuario
/removexp - Elimina xp a un usuario`);
	
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
		ctx.deleteMessage(ctx.message_id || ctx.message.message_id);
	}, 30000);
}

module.exports = {
	start,
	help,
	settings,
};