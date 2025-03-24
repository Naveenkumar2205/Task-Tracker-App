import React, { useState, useEffect } from "react";
import "./styles.css";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [filter, setFilter] = useState("all");
  const [editTaskId, setEditTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [error, setError] = useState(null); // Added for error feedback

  // Fetch tasks from backend on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      console.log("Fetching tasks from http://localhost:5000/tasks");
      const response = await fetch("http://localhost:5000/tasks");
      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Fetched tasks:", data);
      setTasks(data);
      setError(null); // Clear error on success
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setError("Failed to load tasks. Check if the backend is running.");
    }
  };

  const addTask = async () => {
    if (taskInput.trim()) {
      try {
        const response = await fetch("http://localhost:5000/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: taskInput }),
        });
        if (!response.ok) throw new Error("Failed to add task");
        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        setTaskInput("");
        setError(null);
      } catch (error) {
        console.error("Error adding task:", error);
        setError("Failed to add task");
      }
    }
  };

  const toggleComplete = async (id) => {
    try {
      const task = tasks.find((t) => t.id === id);
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (!response.ok) throw new Error("Failed to toggle task");
      const updatedTask = await response.json();
      setTasks(tasks.map((t) => (t.id === id ? updatedTask : t)));
      setError(null);
    } catch (error) {
      console.error("Error toggling task:", error);
      setError("Failed to update task");
    }
  };

  const deleteTask = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/tasks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      setTasks(tasks.filter((task) => task.id !== id));
      if (editTaskId === id) {
        setEditTaskId(null);
        setEditTaskText("");
      }
      setError(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task");
    }
  };

  const startEditing = (task) => {
    setEditTaskId(task.id);
    setEditTaskText(task.text);
  };

  const saveEdit = async (id) => {
    if (editTaskText.trim()) {
      try {
        const response = await fetch(`http://localhost:5000/tasks/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: editTaskText }),
        });
        if (!response.ok) throw new Error("Failed to save task");
        const updatedTask = await response.json();
        setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
        setEditTaskId(null);
        setEditTaskText("");
        setError(null);
      } catch (error) {
        console.error("Error saving task:", error);
        setError("Failed to save task");
      }
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  return (
    <div className="App">
      <h1>Task Tracker</h1>
      {error && <p className="error">{error}</p>}
      <div className="task-tracker">
        <div className="task-input">
          <input
            type="text"
            placeholder="Add a task..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTask()}
          />
          <button onClick={addTask}>Add</button>
        </div>
        <div className="task-filters">
          <button
            onClick={() => setFilter("all")}
            className={filter === "all" ? "active" : ""}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={filter === "completed" ? "active" : ""}
          >
            Completed ({tasks.filter((t) => t.completed).length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={filter === "pending" ? "active" : ""}
          >
            Pending ({tasks.filter((t) => !t.completed).length})
          </button>
        </div>
        <ul className="task-list">
          {filteredTasks.length === 0 ? (
            <li className="no-tasks">No tasks to show</li>
          ) : (
            filteredTasks.map((task) => (
              <li key={task.id} className={task.completed ? "completed" : ""}>
                {editTaskId === task.id ? (
                  <div className="edit-task">
                    <input
                      type="text"
                      value={editTaskText}
                      onChange={(e) => setEditTaskText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && saveEdit(task.id)}
                    />
                    <button onClick={() => saveEdit(task.id)}>Save</button>
                    <button onClick={() => setEditTaskId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <span onClick={() => toggleComplete(task.id)}>
                      {task.text}
                    </span>
                    <div>
                      <button onClick={() => startEditing(task)}>Edit</button>
                      <button onClick={() => toggleComplete(task.id)}>
                        {task.completed ? "Undo" : "Complete"}
                      </button>
                      <button onClick={() => deleteTask(task.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}