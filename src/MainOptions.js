const start = (ctx) => {
	ctx.replyWithMarkdown('Bot moba *privado*');
}

const help = (ctx) => {
	ctx.replyWithMarkdown(`|------- *MOBA RANK parche 2021.5.1* -------|
Puedes usar los siguientes comandos para interactuar con el sistema:
/registrar - Crea una cuenta para unirte a la batalla
/status - Ve tus puntajes, daño y demás
/top - Ve quienes son el TOP 5 mejores brujas del anime
/pelea - Entra en una batalla contra otro usuario _(PRONTO)_
/wordlist - Ver lista de todas las palabras disponibles

*¿CÓMO JUGAR?*
Simplemente escribe un mensaje y ya estarás jugando. La *Agresividad* sube cuando usas alguna de las palabras registradas como _AGRESIVAS_, lo mismo para con la *CARIÑOSIDAD*.

También si mencionas a otra persona @usuaro o simplemente respondes un comentario con alguna de estas dos palabras, los puntos se duplican y sus efectos serán aplicados.`);
}

const settings = (ctx) => {
	ctx.reply(`|------- *MOBA RANK CONFIG parche 2021.5.1* -------|
Puedes usar los siguientes comandos para configurar el sistema:
/addword_soft - Aregar una palabra cariñosa a la lista (EJ: /addword_soft word)
/addword - Aregar una palabra agresiva a la lista (EJ: /addword word)
/removeword - Eliminar una palabra de la lista (EJ: /removeword word)`);
}

module.exports = {
	start,
	help,
	settings,
};