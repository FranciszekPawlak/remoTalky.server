const users = [];

const addUser = (id, userId, conversation) => {
  const user = { id, userId, conversation };
  users.push(user);
  return { user };
};

const getUser = (id) => {
  const user = users.find((user) => user.id === id);
  return user;
};
const getUsersInConversation = (conversationId) =>
  users
    .filter((user) => user.conversation === conversationId)
    .map((element) => element.userId);

const deleteUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
};

module.exports = { addUser, getUser, deleteUser, getUsersInConversation };
