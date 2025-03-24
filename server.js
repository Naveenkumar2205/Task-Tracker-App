const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 5000;
const TASKS_FILE = path.join(__dirname, "tasks.json");

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "https://r6fcm3-5173.csb.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Helper function to read tasks from the JSON file
const readTasks = async () => {
  try {
    const data = await fs.readFile(TASKS_FILE, "utf8");
    const tasks = JSON.parse(data);
    console.log("Read tasks from file:", tasks);
    return tasks;
  } catch (error) {
    console.log("No tasks file found or invalid JSON, starting with empty array");
    return [];
  }
};

// Helper function to write tasks to the JSON file
const writeTasks = async (tasks) => {
  try {
    await fs.writeFile(TASKS_FILE, JSON.stringify(tasks, null, 2), "utf8");
    console.log("Wrote tasks to file:", tasks);
  } catch (error) {
    console.error("Error writing tasks to file:", error);
    throw error; // Re-throw to handle in endpoint
  }
};

// Root route for debugging
app.get("/", (req, res) => {
  res.json({
    message: "Task Tracker Backend is running. Use /tasks to access tasks.",
  });
});

// Get all tasks
app.get("/tasks", async (req, res) => {
  try {
    const tasks = await readTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Add a new task
app.post("/tasks", async (req, res) => {
  try {
    const tasks = await readTasks();
    const newTask = {
      id: Date.now(),
      text: req.body.text,
      completed: false,
    };
    tasks.push(newTask);
    await writeTasks(tasks);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: "Failed to add task" });
  }
});

// Update a task (toggle complete or edit text)
app.put("/tasks/:id", async (req, res) => {
  try {
    const tasks = await readTasks();
    const taskId = parseInt(req.params.id);
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, ...req.body } : task
    );
    await writeTasks(updatedTasks);
    const updatedTask = updatedTasks.find((task) => task.id === taskId);
    if (!updatedTask) return res.status(404).json({ error: "Task not found" });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete a task
app.delete("/tasks/:id", async (req, res) => {
  try {
    const tasks = await readTasks();
    const taskId = parseInt(req.params.id);
    const filteredTasks = tasks.filter((task) => task.id !== taskId);
    if (filteredTasks.length === tasks.length)
      return res.status(404).json({ error: "Task not found" });
    await writeTasks(filteredTasks);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});