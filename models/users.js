import mongoose, { model, Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true
    },
    userName: {
      type: String,
      required: [true, "userName is required"],
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, "password is required"]
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "supervisor", "responsible", "agent", "requester"],
      default: "requester"
    },
  department: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'department',                  
  },
    phone:{
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      validate: {
        validator: function(v) {
          return /^(05|06|07)\d{8}$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number! It must be 10 digits and start with 05, 06 or 07.`
      }
    },
    anyDesk: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (this.isNew || this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.comparePassword = async function (psw) {
  return await bcrypt.compare(psw, this.password);
};

const userModel = model("user", userSchema);
export default userModel;
