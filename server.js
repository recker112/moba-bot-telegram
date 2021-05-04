// NOTA(RECKER): Iniciar variables
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('./bot.js');

app.get('/', (req, res) => {
	res.send('SERVIDOR PA!');
	console.log(process.env.DATABASE_URL, DB);
})

app.listen(port, () => {
  console.log(`Escuchando en el host http://localhost:${port}`);
})