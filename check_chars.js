const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres', 
  password: 'hJ}gp66=S7QqEUR',
  database: 'open_source_rpg'
});

client.connect()
  .then(() => client.query('SELECT id, name FROM Character ORDER BY id'))
  .then(res => {
    console.log('Personagens no banco:');
    res.rows.forEach(row => console.log(`ID: ${row.id}, Nome: ${row.name}`));
  })
  .catch(console.error)
  .finally(() => client.end());
