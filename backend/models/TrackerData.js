const mongoose = require("mongoose");

const TrackerDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  todos: { type: Array, default: [] },
  subjects: { type: Array, default: [] },
  weakAreas: { type: Array, default: [] },
  weeklyTasks: { type: Array, default: [] },
  resources: { type: Array, default: [] },
  updatedAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.TrackerData ||
  mongoose.model("TrackerData", TrackerDataSchema);
