const AuthModel = require("./AuthModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary");
var transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: "simpleboy1917@gmail.com",
    pass: "mkhrfvqxttnljjaw",
  },
});

const userRegister = async (req, res) => {
  const { name, email, password } = req.body;
  const avatar = req?.files?.avatar?.tempFilePath;

  // Check if the user is already registered and verified
  const existingUser = await AuthModel.findOne({
    email: email,
    verified: true,
  });

  // Check if the user is already registered but not verified
  let user = await AuthModel.findOne({ email: email });

  if (existingUser) {
    return res.send({
      message: "User with this email already registered and verified",
    });
  }

  let otpData;
  const currentTimestamp = Date.now();

  if (name && email && password) {
    if (user && user.otp && user.otp_expire > currentTimestamp) {
      // User is already registered but not verified, use the existing OTP
      otpData = user.otp;
    } else {
      // User is not registered or OTP expired, generate a new OTP
      otpData = Math.floor(100000 + Math.random() * 900000).toString();
    }

    const mailOptions = {
      from: "simpleboy1917@gmail.com", // Replace with your email address
      to: email,
      subject: "OTP for Registration",
      text: `Your OTP is ${otpData}`,
    };
    await transport.sendMail(mailOptions);

    try {
      const salt = await bcrypt.genSalt(10);
      const hashpassword = await bcrypt.hash(password, salt);

      if (!user) {
        // User is not registered, create a new user object
        const mycloud = await cloudinary.v2.uploader.upload(avatar);
        user = new AuthModel({
          name: name,
          email: email,
          password: hashpassword,
          otp: otpData,
          blocked: false,
          avatar: {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
          },
          otp_expire: currentTimestamp + 30 * 1000, // OTP will expire after 30 seconds
        });

        // Save the new user object to the database
        await user.save();
      } else {
        // User is already registered, update the existing user object
        user.password = hashpassword;
        user.otp = otpData;
        user.otp_expire = currentTimestamp + 30 * 1000; // OTP will expire after 30 seconds

        await user.save(); // Save the updated user object
      }

      const token = jwt.sign({ UserId: user._id }, "awais9000304", {
        expiresIn: "360d",
      });

      res.status(201).send({
        status: "Success",
        message: "Register successful",
        token: token,
        email,
      });
    } catch (error) {
      res.send({ status: "failed", message: "Unable to register" });
    }
  } else {
    res.send({ message: "Please provide name, email, and password" });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email && password) {
      const user = await AuthModel.findOne({ email: email });
      if (!user) {
        // If the user is not found, return an error response
        return res.status(404).json({
          status: "failed",
          message: "User not registered",
        });
      }
      if (user.blocked) {
        // If the user is blocked, return an error response
        return res.status(403).json({
          message: "You are blocked. Please contact support for assistance.",
        });
      }
      if (user.verified === true) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (email === user.email && isMatch) {
          const token = jwt.sign({ UserId: user._id }, "awais9000304", {
            expiresIn: "30d",
          });
          let fetchId = user._id;
          return res.status(200).json({
            status: "Success",
            message: "User login successful",
            token: token,
            email,
            fetchId,
            blocked: user.blocked,
          });
        } else {
          return res.status(401).json({
            status: "failed",
            message: "Invalid email or password",
          });
        }
      } else {
        return res.status(200).json({
          status: "failed",
          message: "Please first verify your account",
        });
      }
    } else {
      return res.status(400).json({
        status: "failed",
        message: "All fields must be filled",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Please fill in correct data",
    });
  }
};

const logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
      })
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await AuthModel.findOne({ email });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid Email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = new Date(Date.now() + 0.3 * 60 * 1000);

    await user.save();

    const message = `Your OTP for reseting the password ${otp}. If you did not request for this, please ignore this email.`;

    const mailOptions = {
      from: "simpleboy1917@gmail.com", // Replace with your email address
      to: email,
      subject: "OTP for Registration",
      text: message,
    };

    await transport.sendMail(mailOptions);
    res.status(200).json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;

    const user = await AuthModel.findOne({
      resetPasswordOtp: otp,
      resetPasswordExpiry: { $gt: new Date(Date.now() + 0.3 * 60 * 1000) },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Otp Invalid or has been Expired" });
    }
    const hashpassword = await bcrypt.hash(newPassword, 10);

    user.password = hashpassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpiry = null;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: `Password Changed Successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the user by email
    const user = await AuthModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the OTP matches
    if (user.otp.toString() !== otp.toString()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Mark the user as verified
    user.verified = true;
    await user.save();
    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};
const resendOtp = async (req, res) => {
  const { email } = req.body;

  // Check if the user with the given email exists (verified or unverified)
  const existingUser = await AuthModel.findOne({ email: email });
  if (!existingUser) {
    return res.send({ message: "User with this email does not exist" });
  }

  // Generate a new OTP
  const otpData = Math.floor(100000 + Math.random() * 900000).toString();
  const mailOptions = {
    from: "simpleboy1917@gmail.com", // Replace with your email address
    to: email,
    subject: "New OTP for Registration",
    text: `Your new OTP is ${otpData}`,
  };

  try {
    // Send the new OTP to the user's email
    await transport.sendMail(mailOptions);

    // Update the user's OTP and OTP expiration time in the database
    existingUser.otp = otpData;
    existingUser.otp_expire = new Date(Date.now() + 0.3 * 60 * 1000);
    await existingUser.save();

    return res.send({ message: "New OTP sent successfully" });
  } catch (error) {
    res.send({ status: "failed", message: "Unable to resend OTP" });
  }
};
// get Auth by id
const getMyProfile = async (req, res) => {
  try {
    const user = await AuthModel.findOne({ _id: req.params.id });
    res.send(user);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// updateProfile

const getAuth = async (req, res) => {
  await AuthModel.find()
    .then((resultData) => {
      res.json(resultData);
    })
    .catch((err) => console.warn(err));
};
const deleteAuth = async (req, res) => {
  await AuthModel.deleteOne({ _id: req.params.id })
    .then((result5) => {
      res.json(result5);
    })
    .catch((err) => console.warn(err));
};
const updateProfile = async (req, res) => {
  try {
    const user = await AuthModel.findOne({ _id: req.params.id });

    const { name } = req.body;
    const { bio } = req.body;

    const avatar = req.files.avatar.tempFilePath;

    if (name) user.name = name;
    if (bio) user.bio = bio;

    if (avatar) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);

      const mycloud = await cloudinary.v2.uploader.upload(avatar);

      user.avatar = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      };
    }

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Profile Updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const updateUser = (req, res) => {
  AuthModel.updateOne(
    { _id: req.params.id },
    {
      $set: {
        blocked: req.body.blocked,
      },
    }
  )
    .then((result3) => {
      res.json(result3);
    })
    .catch((err) => console.warn(err));
};

module.exports = {
  userRegister,
  getMyProfile,
  userLogin,
  logout,
  forgetPassword,
  resetPassword,
  verify,
  getAuth,
  deleteAuth,
  updateProfile,
  updateUser,
  resendOtp,
};
