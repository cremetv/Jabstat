const getDate = () => {
  const d = new Date();
  const dateSimple = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
  const date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return {
    dateSimple: dateSimple,
    date: date
  }
}

module.exports = getDate;
