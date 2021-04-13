module.exports.conversationInitialName = (conversationsList, requestUserId) => {
  return conversationsList.map((conversation) => {
    if (!conversation.name) {
      let displayName = "";
      conversation.users.forEach((user, index) => {
        if (conversation.users.length > 2) {
          displayName += user.username + " ";
          index === conversation.users.length - 1
            ? null
            : (displayName += ", ");
        } else {
          user._id.toString() !== requestUserId
            ? (displayName = user.username)
            : null;
        }
      });

      conversation.name = displayName;
    }
    return conversation;
  });
};
