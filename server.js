// NOTA(RECKER): Iniciar variables
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
	require('./bot.js');
	res.sendFile('test.html', {root: __dirname })
})

app.listen(port, () => {
  console.log(`Escuchando en el host http://localhost:${port}`);
})