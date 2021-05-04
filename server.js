const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
require('./bot.js');

app.get('/', (req, res) => {
	res.send('SERVIDOR PA!');
	console.log(process.env.DATABASE_URL);
})

app.listen(port, () => {
  console.log(`Escuchando en el host http://localhost:${port}`);
})