const UserSchema = require("../models/User");

module.exports.initialUser = async () => {
  const data = await UserSchema.find({}).exec();
  if (data.length !== 0) {
    return;
  }
  console.log(process.env.ADMIN_EMAIL);
  const user = new UserSchema({
    username: "admin",
    email: process.env.ADMIN_EMAIL,
    password: "root",
    role: 0,
  });

  await user.save();
};
