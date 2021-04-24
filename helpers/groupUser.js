const users = [];

const addUser = (id, userId, group) => {
  const user = { id, userId, group };
  users.push(user);
  return { user };
};

const getUser = (id) => {
  const user = users.find((user) => user.id === id);
  return user;
};
const getUsersInGroup = (groupId) =>
  users
    .filter((user) => user.group === groupId)
    .map((element) => element.userId);

const deleteUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

module.exports = { addUser, getUser, deleteUser, getUsersInGroup };
