module.exports.groupInitialName = (groupList, requestUserId) => {
  return groupList.map((group) => {
    if (!group.name) {
      let displayName = "";
      group.users.forEach((user, index) => {
        if (group.users.length > 2) {
          displayName += user.username + " ";
          index === group.users.length - 1 ? null : (displayName += ", ");
        } else {
          user._id.toString() !== requestUserId
            ? (displayName = user.username)
            : null;
        }
      });

      group.name = displayName;
    }
    return group;
  });
};
