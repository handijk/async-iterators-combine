export const returnUntilDone = async (item) => {
  const { value, done } = await item.return();
  return done ? value : returnUntilDone(item);
};
