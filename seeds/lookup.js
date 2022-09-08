const sequentialPromise = (items, operation) => {
  return items.reduce((prev, item) => {
    return prev
      .then(() => operation(item))
      .catch(err => {
        console.warn('err', err.message);
      });
  }, Promise.resolve());
};

const state = [
  ['Johor', 'JHR'],
  ['Kedah', 'KDH'],
  ['Kelantan', 'KTN'],
  ['Melaka', 'MLK'],
  ['Negeri Sembilan', 'NSN'],
  ['Pahang', 'PHG'],
  ['Perak', 'PRK'],
  ['Perlis', 'PLS'],
  ['Pulau Pinang', 'PNG'],
  ['Sabah', 'SBH'],
  ['Sarawak', 'SWK'],
  ['Selangor', 'SGR'],
  ['Terengganu', 'TRG'],
  ['Wilayah Persekutuan Kuala Lumpur', 'KUL'],
  ['Wilayah Persekutuan Labuan', 'LBN'],
  ['Wilayah Persekutuan Putrajaya', 'PJY']
];

const anotherLookup = [
  { id: 1, name: 'Lookup 1' }
]

function generateState() {
  return state.map((item) => ({
    name: item[0],
    abbreviation: item[1]
  }))
}

const lookups = [
  ['State', generateState()],
  ['LookupTableName', anotherLookup],
];

const seed = async function(knex) {
  await knex.raw('SET foreign_key_checks = 0');
  await sequentialPromise(lookups, (table) => knex(table[0]).truncate())

  await Promise.all(lookups.map(async (table) => {
    await knex(table[0]).insert(table[1]);
  }));

  await knex.raw('SET foreign_key_checks = 1');
  return
}

export { seed };
