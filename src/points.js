bot.command('chavez', ctx => {
	ctx.replyWithMarkdown(`*Jugador*: ${ctx.from.first_name} ${ctx.from.last_name}
*EXP*: ${puntos[ctx.from.username] || 0} pts
*Nivel*: ${puntos[ctx.from.username] || 0}`);
});