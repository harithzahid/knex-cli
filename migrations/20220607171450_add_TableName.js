function up(knex) {
  return knex.schema.createTable('TableName', (table) => {
    table.increments('Id').primary();
    table.string('ColumnName');
  });
};

function down(knex) {
  return
};

export { up, down };
