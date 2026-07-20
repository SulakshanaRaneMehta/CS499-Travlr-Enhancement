const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
require("../models/user");
const User = mongoose.model("users");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    async (username, password, done) => {
      try {
        const user = await User.findOne({
          email: username.trim().toLowerCase()
        }).exec();

        if (!user || !user.validPassword(password)) {
          return done(null, false, {
            message: "Incorrect email or password.",
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);
