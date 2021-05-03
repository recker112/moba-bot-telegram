const Database = require('sqlite-async');

const addword_soft = async (ctx) => {
	let entities = ctx.message.entities;

	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra');
		return null;
	}
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = 'INSERT INTO words (word,status) VALUES (?,2)';
			
		const res = await db.run(sql, [word]);
		
		let response = await ctx.replyWithMarkdown('¡Palabra agregada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabras introducidas ya se encuentra registrada, intente de nuevo.');;
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

const addword = async (ctx) => {
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra');
		return null;
	}
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = 'INSERT INTO words (word,status) VALUES (?,1)';
			
		const res = await db.run(sql, [word]);
		
		let response = await ctx.replyWithMarkdown('¡Palabra agregada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabras introducidas ya se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

const wordlist = async (ctx) => {
	const db = await Database.open('./moba.db');
	let sql = 'SELECT * FROM words';

	const words = await db.all(sql);
	
	let wordsList = '';
	words.map(({ word, status }) => {
		wordsList = wordsList + `- *${word}* ${status === 1 ? '_(AGRESIVA)_' : '_(CARIÑOSA)_'}\n`;
	})
	
	let response = await ctx.replyWithMarkdown(`Estas son las palabras registradas:\n
${wordsList}`);
	setTimeout(() => {
		ctx.deleteMessage(response.message_id);
	}, 10000);
}

const removeword = async (ctx) => {
	let word = ctx.message.text.slice(ctx.message.entities[0].length + 1);
	if (!word.length) {
		ctx.replyWithMarkdown('Debe de colocar una palabra');
		return null;
	}
	
	const db = await Database.open('./moba.db');
	
	try {
		let sql = 'DELETE FROM words WHERE word=?';
			
		const res = await db.run(sql, [word]);
		
		let response = await ctx.replyWithMarkdown('¡Palabra eliminada!');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}catch (e) {
		console.log(e);
		let response = await ctx.replyWithMarkdown('La palabras introducidas no se encuentra registrada, intente de nuevo.');
		setTimeout(() => {
			ctx.deleteMessage(response.message_id);
		}, 2000);
	}
}

module.exports = {
	addword_soft,
	addword,
	wordlist,
	removeword,
};